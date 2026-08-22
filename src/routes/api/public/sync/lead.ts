import { createFileRoute } from "@tanstack/react-router";
import { DeviceNotClaimedError, getDeviceId, getSyncTimestamp, requireDeviceOwner } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

const VALID_STATUSES = new Set(["new", "connected", "messaged", "replied", "followup_due", "archived"]);

const STATUS_RANK: Record<string, number> = { new: 0, connected: 1, messaged: 2, replied: 3, followup_due: 4, archived: 5 };

function statusRank(s: string): number {
  return STATUS_RANK[s] ?? 0;
}

export const Route = createFileRoute("/api/public/sync/lead")({
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

        if (!body.name) return Response.json({ error: "name is required" }, { status: 400, headers: CORS_HEADERS });

        const status = VALID_STATUSES.has(body.status) ? body.status : "new";
        const occurredAt = getSyncTimestamp(body.occurred_at);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let user_id: string;
        try {
          user_id = await requireDeviceOwner(device_id);
        } catch (error) {
          if (error instanceof DeviceNotClaimedError) {
            return Response.json({ error: error.message }, { status: 401, headers: CORS_HEADERS });
          }
          console.error("[sync/lead] device ownership lookup error", error);
          return Response.json({ error: "Unable to verify extension device" }, { status: 503, headers: CORS_HEADERS });
        }

        let query = supabaseAdmin
          .from("leads")
          .select("id, status, headline, profile_url, updated_at")
          .eq("device_id", device_id)
          .eq("name", body.name);

        const { data: existing, error: existingError } = await query.maybeSingle();
        if (existingError) {
          console.error("[sync/lead] lookup error", existingError);
          return Response.json({ error: "Failed to look up lead" }, { status: 500, headers: CORS_HEADERS });
        }

        const nextStatus = existing
          ? statusRank(status) >= statusRank(existing.status) ? status : existing.status
          : status;

        const now = new Date().toISOString();
        const updatedAt = existing?.updated_at && occurredAt && existing.updated_at > occurredAt
          ? existing.updated_at
          : occurredAt ?? now;
        const row = {
          device_id,
          user_id,
          name: body.name,
          headline: body.headline || existing?.headline || null,
          profile_url: body.profile_url || existing?.profile_url || null,
          status: nextStatus,
          ...(existing ? {} : { created_at: occurredAt ?? now }),
          updated_at: updatedAt,
        };

        let leadId: string;
        if (existing) {
          const { error } = await supabaseAdmin.from("leads").update(row).eq("id", existing.id);
          if (error) {
            console.error("[sync/lead] update error", error);
            return Response.json({ error: "Failed to update lead" }, { status: 500, headers: CORS_HEADERS });
          }
          leadId = existing.id;
        } else {
          const { data: inserted, error } = await supabaseAdmin.from("leads").insert(row).select("id").single();
          if (error) {
            console.error("[sync/lead] insert error", error);
            return Response.json({ error: "Failed to insert lead" }, { status: 500, headers: CORS_HEADERS });
          }
          leadId = inserted.id;
        }

        return Response.json({ id: leadId }, { headers: CORS_HEADERS });
      },
    },
  },
});
