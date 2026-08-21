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
        const { error } = await supabaseAdmin.rpc("increment_daily_activity", {
          p_device_id: device_id,
          p_date: date,
          p_connections_sent: body.connections_sent ?? 0,
          p_comments_made: body.comments_made ?? 0,
          p_posts_created: body.posts_created ?? 0,
          p_messages_sent: body.messages_sent ?? 0,
          p_messages_received: body.messages_received ?? 0,
        });

        if (error) {
          console.error("[sync/activity] atomic increment error", error);
          return Response.json({ error: "Failed to sync activity" }, { status: 500, headers: CORS_HEADERS });
        }

        return Response.json({ ok: true }, { headers: CORS_HEADERS });
      },
    },
  },
});
