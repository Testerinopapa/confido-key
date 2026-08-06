import { createFileRoute } from "@tanstack/react-router";
import { authError, resolveAuth } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/sync/fingerprints")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async ({ request }) => {
        const auth = await resolveAuth(request);
        if (!auth) return authError();
        const { user_id, device_id } = auth;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let q = supabaseAdmin.from("fingerprints").select("fingerprint, kind");
        q = user_id ? q.eq("user_id", user_id) : q.eq("device_id", device_id);

        const { data } = await q;
        const comments = (data ?? []).filter(f => f.kind === "comment").map(f => f.fingerprint);
        const posts = (data ?? []).filter(f => f.kind === "post").map(f => f.fingerprint);

        return Response.json({ comments, posts }, { headers: CORS_HEADERS });
      },

      POST: async ({ request }) => {
        const auth = await resolveAuth(request);
        if (!auth) return authError();
        const { user_id, device_id } = auth;

        let body: any;
        try { body = await request.json(); } catch {
          return Response.json({ error: "Request body must be JSON" }, { status: 400, headers: CORS_HEADERS });
        }

        if (!body.fingerprint || !body.kind) {
          return Response.json({ error: "fingerprint and kind are required" }, { status: 400, headers: CORS_HEADERS });
        }

        if (body.kind !== "comment" && body.kind !== "post") {
          return Response.json({ error: 'kind must be "comment" or "post"' }, { status: 400, headers: CORS_HEADERS });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { error } = await supabaseAdmin.from("fingerprints").upsert(
          { device_id, user_id, fingerprint: body.fingerprint, kind: body.kind },
          { onConflict: "fingerprint,kind,COALESCE(user_id, device_id)" },
        );

        if (error) {
          console.error("[sync/fingerprints] upsert error", error);
          return Response.json({ error: "Failed to save fingerprint" }, { status: 500, headers: CORS_HEADERS });
        }

        return Response.json({ ok: true }, { headers: CORS_HEADERS });
      },
    },
  },
});
