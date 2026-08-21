import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/claude")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const apiKey = process.env["ANTHROPIC_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "ANTHROPIC_API_KEY is not configured on the server" },
            { status: 500, headers: CORS_HEADERS },
          );
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json(
            { error: "Request body must be JSON" },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          return Response.json(
            { error: "Request body must be a JSON object matching the Anthropic Messages API" },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(payload),
        });

        // Pass the upstream body straight through (works for JSON and SSE streams).
        const headers = new Headers(CORS_HEADERS);
        headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/json");
        if (!upstream.ok) {
          const text = await upstream.text();
          console.error(`Anthropic request failed [${upstream.status}]: ${text}`);
          return new Response(text, { status: upstream.status, headers });
        }

        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
