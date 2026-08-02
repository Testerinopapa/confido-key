import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShieldCheck, Plug, Terminal } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Key Vault Pro — Hosted AI Keys for Your LinkedIn Extension" },
      {
        name: "description",
        content:
          "A hosted proxy that keeps your Claude and Gemini API keys server-side, so extension users never paste keys manually.",
      },
      { property: "og:title", content: "Key Vault Pro — Hosted AI Keys for Your LinkedIn Extension" },
      {
        property: "og:description",
        content:
          "A hosted proxy that keeps your Claude and Gemini API keys server-side, so extension users never paste keys manually.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const endpoints = [
  {
    method: "POST",
    path: "/api/public/claude",
    provider: "Anthropic Messages API",
    note: "Body is forwarded verbatim to /v1/messages. Streaming (SSE) passes through.",
    sample: `await fetch("https://YOUR-APP.lovable.app/api/public/claude", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: "Draft a LinkedIn reply" }],
  }),
});`,
  },
  {
    method: "POST",
    path: "/api/public/gemini",
    provider: "Google Generative Language API",
    note: 'Send "model" and optional "action" alongside the payload. Defaults: gemini-3.1-flash-image-preview / generateContent.',
    sample: `await fetch("https://YOUR-APP.lovable.app/api/public/gemini", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gemini-3.1-flash-image-preview",
    action: "generateContent",
    contents: [{ parts: [{ text: "Draft a LinkedIn reply" }] }],
  }),
});`,
  },
];

const facts = [
  {
    icon: KeyRound,
    title: "Keys live server-side",
    body: "ANTHROPIC_API_KEY and GEMINI_API_KEY are read only inside the request handler. They are never bundled, logged, or returned.",
  },
  {
    icon: Plug,
    title: "Drop-in for the extension",
    body: "Swap the provider base URL for these endpoints and delete the key input screen. Request and response shapes are unchanged.",
  },
  {
    icon: ShieldCheck,
    title: "CORS ready",
    body: "Preflight and cross-origin POSTs are allowed, so content scripts on linkedin.com can call the proxy directly.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "var(--gradient-glow)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "var(--surface-grid)", backgroundSize: "44px 44px" }}
        aria-hidden="true"
      />

      <main className="relative mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            Key relay service
          </span>
          <h1 className="mt-6 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Your extension calls this. <span className="text-primary">Not the providers.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            A minimal hosted relay for your LinkedIn automation extension. It holds your Claude
            and Gemini keys on the server and forwards requests unchanged, so end users never
            paste an API key again.
          </p>
        </header>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {facts.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-lg border border-border bg-card p-5"
              style={{ boxShadow: "var(--shadow-panel)" }}
            >
              <Icon className="h-5 w-5 text-accent" />
              <h2 className="mt-4 text-sm font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 space-y-6">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Endpoints
          </h2>
          {endpoints.map((endpoint) => (
            <article
              key={endpoint.path}
              className="overflow-hidden rounded-lg border border-border bg-card"
              style={{ boxShadow: "var(--shadow-panel)" }}
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {endpoint.method}
                </span>
                <code
                  className="text-sm font-medium"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {endpoint.path}
                </code>
                <span className="text-xs text-muted-foreground">→ {endpoint.provider}</span>
              </div>
              <p className="px-5 pt-4 text-sm text-muted-foreground">{endpoint.note}</p>
              <pre
                className="mt-4 overflow-x-auto border-t border-border bg-secondary/40 px-5 py-4 text-xs leading-relaxed"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <code>{endpoint.sample}</code>
              </pre>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-sm font-semibold">Open by design — for now</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            These endpoints are unauthenticated, so anyone who finds the URL can spend your
            provider credits. Add user login or per-install license keys before shipping the
            extension publicly.
          </p>
        </section>
      </main>
    </div>
  );
}
