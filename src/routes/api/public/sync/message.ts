import { createFileRoute } from "@tanstack/react-router";
import { authError, getDeviceId, validateApiKey } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/sync/message")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        if (!validateApiKey(request)) return authError();
        const deviceId = getDeviceId(request);
        if (!deviceId) return Response.json({ error: "Missing X-Device-Id header" }, { status: 400, headers: CORS_HEADERS });

        let body: any;
        try { body = await request.json(); } catch {
          return Response.json({ error: "Request body must be JSON" }, { status: 400, headers: CORS_HEADERS });
        }

        if (!body.content) {
          return Response.json({ error: "content is required" }, { status: 400, headers: CORS_HEADERS });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let leadId = body.lead_id as string | undefined;
        if (!leadId && body.lead_name) {
          const { data } = await supabaseAdmin.from("leads")
            .select("id").eq("device_id", deviceId).eq("name", body.lead_name).maybeSingle();
          leadId = data?.id;
        }
        if (!leadId) {
          return Response.json({ error: "lead_id or lead_name is required and must match an existing lead" }, { status: 400, headers: CORS_HEADERS });
        }

        const direction = body.direction === "inbound" ? "inbound" : "outbound";

        const { error } = await supabaseAdmin.from("messages").insert({
          device_id: deviceId,
          lead_id: leadId,
          direction,
          content: body.content,
          ai_generated: body.ai_generated ?? false,
        });

        if (error) {
          console.error("[sync/message] insert error", error);
          return Response.json({ error: "Failed to save message" }, { status: 500, headers: CORS_HEADERS });
        }

        return Response.json({ ok: true }, { headers: CORS_HEADERS });
      },
    },
  },
});
