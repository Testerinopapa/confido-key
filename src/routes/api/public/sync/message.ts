import { createFileRoute } from "@tanstack/react-router";
import { DeviceNotClaimedError, getDeviceId, getSyncTimestamp, requireDeviceOwner } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/sync/message")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const device_id = getDeviceId(request);
        if (!device_id) {
          return Response.json({ error: "Missing X-Device-Id header" }, { status: 400, headers: CORS_HEADERS });
        }

        let body: any;
        try { body = await request.json(); } catch {
          return Response.json({ error: "Request body must be JSON" }, { status: 400, headers: CORS_HEADERS });
        }

        if (!body.content) {
          return Response.json({ error: "content is required" }, { status: 400, headers: CORS_HEADERS });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let user_id: string;
        try {
          user_id = await requireDeviceOwner(device_id);
        } catch (error) {
          if (error instanceof DeviceNotClaimedError) {
            return Response.json({ error: error.message }, { status: 401, headers: CORS_HEADERS });
          }
          console.error("[sync/message] device ownership lookup error", error);
          return Response.json({ error: "Unable to verify extension device" }, { status: 503, headers: CORS_HEADERS });
        }

        let leadId = body.lead_id as string | undefined;
        if (!leadId && body.lead_name) {
          const q = supabaseAdmin.from("leads").select("id").eq("device_id", device_id).eq("name", body.lead_name);
          const { data, error } = await q.maybeSingle();
          if (error) {
            console.error("[sync/message] lead lookup error", error);
            return Response.json({ error: "Failed to look up lead" }, { status: 500, headers: CORS_HEADERS });
          }
          leadId = data?.id;
        }
        if (!leadId) {
          return Response.json({ error: "lead_id or lead_name is required and must match an existing lead" }, { status: 400, headers: CORS_HEADERS });
        }

        const direction = body.direction === "inbound" ? "inbound" : "outbound";
        const occurredAt = getSyncTimestamp(body.occurred_at);

        const message = {
          device_id,
          user_id,
          lead_id: leadId,
          direction,
          content: body.content,
          ai_generated: body.ai_generated ?? false,
          ...(occurredAt ? { created_at: occurredAt } : {}),
        };
        const { error } = await supabaseAdmin.from("messages").insert(message);

        if (error) {
          console.error("[sync/message] insert error", error);
          return Response.json({ error: "Failed to save message" }, { status: 500, headers: CORS_HEADERS });
        }

        return Response.json({ ok: true }, { headers: CORS_HEADERS });
      },
    },
  },
});
