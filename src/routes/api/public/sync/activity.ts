import { createFileRoute } from "@tanstack/react-router";
import { authError, getDeviceId, validateApiKey } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/sync/activity")({
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Upsert by date + device_id: increment counters
        const date = body.date || new Date().toISOString().slice(0, 10);

        // Fetch existing row for today
        const { data: existing } = await supabaseAdmin
          .from("daily_activity")
          .select("id, connections_sent, comments_made, posts_created, messages_sent, messages_received")
          .eq("device_id", deviceId)
          .eq("date", date)
          .maybeSingle();

        const row = {
          device_id: deviceId,
          date,
          connections_sent: (existing?.connections_sent ?? 0) + (body.connections_sent ?? 0),
          comments_made: (existing?.comments_made ?? 0) + (body.comments_made ?? 0),
          posts_created: (existing?.posts_created ?? 0) + (body.posts_created ?? 0),
          messages_sent: (existing?.messages_sent ?? 0) + (body.messages_sent ?? 0),
          messages_received: (existing?.messages_received ?? 0) + (body.messages_received ?? 0),
        };

        const { error } = existing
          ? await supabaseAdmin.from("daily_activity").update(row).eq("id", existing.id)
          : await supabaseAdmin.from("daily_activity").insert(row);

        if (error) {
          console.error("[sync/activity] upsert error", error);
          return Response.json({ error: "Failed to sync activity" }, { status: 500, headers: CORS_HEADERS });
        }

        return Response.json({ ok: true }, { headers: CORS_HEADERS });
      },
    },
  },
});
