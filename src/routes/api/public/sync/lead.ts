import { createFileRoute } from "@tanstack/react-router";
import { authError, resolveAuth } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, X-Device-Id",
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
        const auth = await resolveAuth(request);
        if (!auth) return authError();
        const { user_id, device_id } = auth;

        let body: any;
        try { body = await request.json(); } catch {
          return Response.json({ error: "Request body must be JSON" }, { status: 400, headers: CORS_HEADERS });
        }

        if (!body.name) return Response.json({ error: "name is required" }, { status: 400, headers: CORS_HEADERS });

        const status = VALID_STATUSES.has(body.status) ? body.status : "new";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Upsert by user_id+name (preferred) or device_id+name (fallback)
        let query = supabaseAdmin
          .from("leads")
          .select("id, status, headline, profile_url")
          .eq("name", body.name);
        query = user_id ? query.eq("user_id", user_id) : query.eq("device_id", device_id);

        const { data: existing } = await query.maybeSingle();

        const nextStatus = existing
          ? statusRank(status) >= statusRank(existing.status) ? status : existing.status
          : status;

        const row = {
          device_id,
          user_id,
          name: body.name,
          headline: body.headline || existing?.headline || null,
          profile_url: body.profile_url || existing?.profile_url || null,
          status: nextStatus,
          updated_at: new Date().toISOString(),
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
