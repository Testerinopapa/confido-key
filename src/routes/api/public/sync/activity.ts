import { createFileRoute } from "@tanstack/react-router";
import { getDeviceId } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/sync/activity")({
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const date = body.date || new Date().toISOString().slice(0, 10);
        let query = supabaseAdmin
          .from("daily_activity")
          .select("id, connections_sent, comments_made, posts_created, messages_sent, messages_received")
          .eq("device_id", device_id)
          .eq("date", date);

        const { data: existing } = await query.maybeSingle();

        const row = {
          device_id,
          user_id: null,
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
