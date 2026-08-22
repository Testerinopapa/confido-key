import { createFileRoute } from "@tanstack/react-router";
import { DeviceNotClaimedError, getDeviceId, getSyncTimestamp, requireDeviceOwner } from "../auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/sync/fingerprints")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async ({ request }) => {
        const device_id = getDeviceId(request);
        if (!device_id) {
          return Response.json({ error: "Missing X-Device-Id header" }, { status: 400, headers: CORS_HEADERS });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        try {
          await requireDeviceOwner(device_id);
        } catch (error) {
          if (error instanceof DeviceNotClaimedError) {
            return Response.json({ error: error.message }, { status: 401, headers: CORS_HEADERS });
          }
          console.error("[sync/fingerprints] device ownership lookup error", error);
          return Response.json({ error: "Unable to verify extension device" }, { status: 503, headers: CORS_HEADERS });
        }
        const { data, error } = await supabaseAdmin
          .from("fingerprints")
          .select("fingerprint, kind")
          .eq("device_id", device_id);

        if (error) {
          console.error("[sync/fingerprints] read error", error);
          return Response.json({ error: "Failed to load fingerprints" }, { status: 500, headers: CORS_HEADERS });
        }

        const comments = (data ?? []).filter(f => f.kind === "comment").map(f => f.fingerprint);
        const posts = (data ?? []).filter(f => f.kind === "post").map(f => f.fingerprint);

        return Response.json({ comments, posts }, { headers: CORS_HEADERS });
      },

      POST: async ({ request }) => {
        const device_id = getDeviceId(request);
        if (!device_id) {
          return Response.json({ error: "Missing X-Device-Id header" }, { status: 400, headers: CORS_HEADERS });
        }

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

        const occurredAt = getSyncTimestamp(body.occurred_at);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let user_id: string;
        try {
          user_id = await requireDeviceOwner(device_id);
        } catch (error) {
          if (error instanceof DeviceNotClaimedError) {
            return Response.json({ error: error.message }, { status: 401, headers: CORS_HEADERS });
          }
          console.error("[sync/fingerprints] device ownership lookup error", error);
          return Response.json({ error: "Unable to verify extension device" }, { status: 503, headers: CORS_HEADERS });
        }

        const { data: existing, error: lookupError } = await supabaseAdmin
          .from("fingerprints")
          .select("id")
          .eq("device_id", device_id)
          .eq("fingerprint", body.fingerprint)
          .eq("kind", body.kind)
          .maybeSingle();

        if (lookupError) {
          console.error("[sync/fingerprints] lookup error", lookupError);
          return Response.json({ error: "Failed to look up fingerprint" }, { status: 500, headers: CORS_HEADERS });
        }

        let error = null;
        if (!existing) {
          const owner = await getDeviceOwner(device_id);
          const result = await supabaseAdmin.from("fingerprints").insert({
            device_id,
            user_id: owner,
            fingerprint: body.fingerprint,
            kind: body.kind,
            ...(occurredAt ? { created_at: occurredAt } : {}),
          });
          error = result.error;
        }

        if (error) {
          console.error("[sync/fingerprints] upsert error", error);
          return Response.json({ error: "Failed to save fingerprint" }, { status: 500, headers: CORS_HEADERS });
        }

        return Response.json({ ok: true }, { headers: CORS_HEADERS });
      },
    },
  },
});
