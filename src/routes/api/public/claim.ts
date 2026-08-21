import { createFileRoute } from "@tanstack/react-router";
import { hashExtensionClaimCode } from "@/lib/extension-claim";
import { getDeviceId } from "./auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/claim")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const deviceId = getDeviceId(request);
        if (!deviceId) {
          return Response.json({ error: "Missing X-Device-Id header" }, { status: 400, headers: CORS_HEADERS });
        }

        let body: any;
        try { body = await request.json(); } catch {
          return Response.json({ error: "Request body must be JSON" }, { status: 400, headers: CORS_HEADERS });
        }

        if (typeof body.code !== "string" || !body.code.trim()) {
          return Response.json({ error: "code is required" }, { status: 400, headers: CORS_HEADERS });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userId, error } = await supabaseAdmin.rpc("claim_extension_device", {
          p_code_hash: await hashExtensionClaimCode(body.code),
          p_device_id: deviceId,
        });

        if (error) {
          console.error("[public/claim] claim error", error);
          return Response.json({ error: "Invalid or expired extension code" }, { status: 400, headers: CORS_HEADERS });
        }

        return Response.json({ ok: true, userId }, { headers: CORS_HEADERS });
      },
    },
  },
});
