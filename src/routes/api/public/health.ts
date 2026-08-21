import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
};

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: () => {
        const hasClaude = !!process.env["ANTHROPIC_API_KEY"];
        const hasGemini = !!process.env["GEMINI_API_KEY"];

        return Response.json(
          {
            status: "ok",
            version: "1.0.0",
            providers: {
              claude: hasClaude,
              gemini: hasGemini,
            },
          },
          { headers: CORS_HEADERS },
        );
      },
    },
  },
});
