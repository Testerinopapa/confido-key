import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED_ACTIONS = new Set([
  "generateContent",
  "streamGenerateContent",
  "countTokens",
  "embedContent",
]);

const MODEL_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const Route = createFileRoute("/api/public/gemini")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const apiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "GEMINI_API_KEY is not configured on the server" },
            { status: 500, headers: CORS_HEADERS },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "Request body must be JSON" },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        if (typeof body !== "object" || body === null || Array.isArray(body)) {
          return Response.json(
            { error: "Request body must be a JSON object" },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const { model, action, ...payload } = body as Record<string, unknown>;
        const modelName = typeof model === "string" ? model : "gemini-3.1-flash-image-preview";
        const actionName = typeof action === "string" ? action : "generateContent";

        if (!MODEL_PATTERN.test(modelName)) {
          return Response.json(
            { error: "Invalid model name" },
            { status: 400, headers: CORS_HEADERS },
          );
        }
        if (!ALLOWED_ACTIONS.has(actionName)) {
          return Response.json(
            { error: `Unsupported action. Allowed: ${[...ALLOWED_ACTIONS].join(", ")}` },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const upstream = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${actionName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(payload),
          },
        );

        const headers = new Headers(CORS_HEADERS);
        headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/json");
        if (!upstream.ok) {
          const text = await upstream.text();
          console.error(`Gemini request failed [${upstream.status}]: ${text}`);
          return new Response(text, { status: upstream.status, headers });
        }

        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
