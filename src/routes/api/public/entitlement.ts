import { createFileRoute } from "@tanstack/react-router";
import { getDeviceId, getDeviceOwner, getDevicePlan, isPremiumPlan } from "./auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/entitlement")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => {
        const deviceId = getDeviceId(request);
        if (!deviceId) {
          return Response.json({ error: "Missing X-Device-Id header" }, { status: 400, headers: CORS_HEADERS });
        }

        try {
          const userId = await getDeviceOwner(deviceId);
          if (!userId) {
            return Response.json({ claimed: false, plan: "Free", premium: false }, { headers: CORS_HEADERS });
          }

          const plan = await getDevicePlan(deviceId);
          return Response.json({ claimed: true, plan, premium: isPremiumPlan(plan) }, { headers: CORS_HEADERS });
        } catch (error) {
          console.error("[public/entitlement] lookup error", error);
          return Response.json({ error: "Unable to read extension entitlement" }, { status: 500, headers: CORS_HEADERS });
        }
      },
    },
  },
});
