import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import {
  AlertCircle,
  BarChart3,

  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Filter,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Upload,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const metrics = [
  ["Connection Sent", "1,982", "+14.8%"],
  ["Comments Made", "842", "+15.2%"],
  ["Posts Created", "128", "+9.7%"],
  ["Messages Sent", "637", "+8.4%"],
  ["Replies Received", "412", "+13.4%"],
];

const nav = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Activity", "/analytics", CheckCircle2],
  ["Analytics", "/analytics", BarChart3],
  ["Campaigns", "/pipeline", Send],
  ["Reports", "/analytics", FileText],
  ["Extension", "/extension", Download],
] as const;
const columns = ["New", "Connected", "Messaged", "Replied", "Follow-up Due", "Archived"];
const names = [
  "Rohan Mehta",
  "Priya Nair",
  "Arjun Patel",
  "Neha Sharma",
  "Vikas Gupta",
  "Anjali Iyer",
  "David Wong",
  "Lisa Chen",
  "Kamal Shah",
  "James Wilson",
  "Maria Rodriguez",
  "Sandeep Rao",
  "Alex Morgan",
  "Emily Brown",
  "Daniel Kim",
  "Jason Lee",
  "Rachel Green",
  "Amit Verma",
];
const linePoints = [
  "12,92 86,57 161,45 235,41 310,34 384,43 459,39 533,24 608,29",
  "12,128 86,111 161,86 235,82 310,73 384,83 459,76 533,64 608,67",
  "12,170 86,143 161,128 235,120 310,113 384,124 459,118 533,106 608,101",
  "12,196 86,175 161,156 235,150 310,142 384,153 459,149 533,139 608,134",
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-950">
      <span className="grid h-8 w-8 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-lg tracking-[-0.03em]">AudiencePilot</span>
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "soft";
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  return (
    <button className={`btn ${variant}`} {...rest}>
      {children}
    </button>
  );
}

export function Chart({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={compact ? "h-36 w-full" : "h-48 w-full"}
      viewBox="0 0 640 230"
      role="img"
      aria-label="Performance line chart"
    >
      {[40, 85, 130, 175, 220].map((y) => (
        <line key={y} x1="10" x2="625" y1={y} y2={y} className="stroke-slate-100" />
      ))}
      {linePoints.map((points, index) => (
        <polyline
          key={points}
          points={points}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            ["stroke-blue-600", "stroke-blue-400", "stroke-emerald-500", "stroke-violet-500"][index]
          }
        />
      ))}
      {linePoints.flatMap((points, series) =>
        points.split(" ").map((point) => {
          const [cx, cy] = point.split(",");
          return (
            <circle
              key={`${series}-${point}`}
              cx={cx}
              cy={cy}
              r="4"
              className={
                ["fill-blue-600", "fill-blue-400", "fill-emerald-500", "fill-violet-500"][series]
              }
            />
          );
        }),
      )}
    </svg>
  );
}

const EXTENSION_FILE = "audiencepilot-extension.zip";

const installSteps = [
  "Download and unzip the extension package.",
  "Open chrome://extensions in Chrome, Edge, Brave, or Arc.",
  "Turn on Developer mode (top-right toggle).",
  'Click "Load unpacked" and pick the unzipped folder.',
  "Open the AudiencePilot popup and hit Test connection.",
];

export function ExtensionDownload() {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const fetchUrl = useServerFn(getExtensionDownloadUrl);

  function handleDownload() {
    setState("busy");
    fetchUrl({})
      .then(({ url, filename }) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setState("idle");
      })
      .catch(() => setState("error"));
  }


  return (
    <section
      id="download"
      className="mx-auto mt-20 grid max-w-5xl gap-8 rounded-2xl border border-slate-200 bg-white p-8 lg:grid-cols-[1.1fr_1fr]"
      style={{ boxShadow: "var(--shadow-panel)" }}
    >
      <div>
        <div className="pill">
          <Download className="h-3.5 w-3.5" /> Chrome Extension · v1.0.0
        </div>
        <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">
          Download the extension
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          Works in Chrome, Edge, Brave, Arc and Opera. The Claude and Gemini keys stay on our
          server — your team never pastes an API key anywhere.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={handleDownload} disabled={state === "busy"}>
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {state === "busy" ? "Preparing…" : "Download .zip"}
            </span>
          </Button>
          <span className="text-xs font-medium text-slate-500">Manifest V3 · ~13 KB</span>
        </div>
        {state === "error" ? (
          <p className="mt-3 text-xs font-semibold text-red-600">
            Could not fetch the package. Please retry in a moment.
          </p>
        ) : null}
      </div>
      <ol className="space-y-3 rounded-xl bg-slate-50 p-6 text-sm text-slate-700">
        {installSteps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="leading-6">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function LandingPage() {
  const { user, loading } = useAuth();
  return (
    <main className="page-shell">
      <section className="panel hero-panel mx-auto max-w-7xl overflow-hidden p-10">
        <header className="flex items-center justify-between border-b border-slate-100 pb-5">
          <Logo />
          <nav className="hidden gap-12 text-sm font-semibold text-slate-700 lg:flex">
            <span>Product</span>
            <span>Features</span>
            <span>Pricing</span>
            <span>Resources</span>
            <span>Changelog</span>
          </nav>
          <div className="flex gap-3">
            {loading ? null : user ? (
              <Link to="/dashboard">
                <Button>Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/login">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="relative grid gap-10 pt-12 lg:grid-cols-[1fr_1.08fr]">
          <div>
            <div className="pill">
              <Zap className="h-3.5 w-3.5" /> #1 LinkedIn Automation & Monitoring Platform
            </div>
            <h1 className="mt-7 max-w-xl text-6xl font-extrabold leading-[0.96] tracking-[-0.06em] text-slate-950">
              Automate. Monitor. <span className="text-blue-600">Scale your outreach.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
              AudiencePilot helps you manage connection requests, comments, posts, DMs, scheduling,
              and lead tracking — all from one intelligent dashboard.
            </p>
            <div className="mt-7 flex gap-4">
              <Link to="/dashboard">
                <Button>Get Started Free</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="soft">View Dashboard</Button>
              </Link>
            </div>
            <div className="mt-5 flex gap-5 text-xs font-medium text-slate-500">
              <span>◇ No credit card required</span>
              <span>◇ 14-day free trial</span>
              <span>◇ Cancel anytime</span>
            </div>
          </div>
          <div className="dashboard-card mt-3 p-5">
            <div className="mb-4 flex items-center justify-between">
              <b>Overview</b>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {metrics.map((m) => (
                <div className="metric mini" key={m[0]}>
                  <span>{m[0]}</span>
                  <b>{m[1]}</b>
                  <em>{m[2]}</em>
                </div>
              ))}
            </div>
            <Chart compact />
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Auto-Connect",
              "Send personalized connection requests with AI-generated notes on People You May Know and search results.",
            ],
            [
              "Auto-Comment",
              "Find posts by keyword and comment with AI-generated replies that match the author's tone and topic.",
            ],
            [
              "Auto-Post",
              "Create feed posts with AI text (Claude) and images (Gemini), pasted into LinkedIn's editor via secure CDP.",
            ],
            [
              "Auto-Reply (DM)",
              "Monitor your inbox and auto-reply to unread conversations with context-aware AI responses.",
            ],
            [
              "Lead Pipeline",
              "Track every connection through 6 stages: New → Connected → Messaged → Replied → Follow-up Due → Archived.",
            ],
            [
              "Activity Tracking",
              "Daily and 7-day rolling stats for connections, comments, posts, and messages sent/received.",
            ],
            [
              "Daily Scheduling",
              "Schedule each mode to run automatically at a set hour — midnight reset keeps counts clean.",
            ],
            [
              "Secure API Proxy",
              "Claude and Gemini keys stay server-side. Authenticated via X-Api-Key — never exposed to the browser.",
            ],
          ].map(([title, desc]) => (
            <div className="feature" key={title}>
              <span className="icon">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <b>{title}</b>
              <p>{desc}</p>
            </div>
          ))}
        </div>

        



        <section className="mx-auto mt-20 max-w-3xl space-y-6">
          <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
            API Endpoints
          </h2>
          {[
            {
              method: "POST",
              path: "/api/public/claude",
              provider: "Anthropic Messages API",
              note: "Body forwarded verbatim to /v1/messages. SSE streaming passes through. Requires X-Api-Key header.",
              sample: `fetch("https://YOUR-INSTANCE.lovable.app/api/public/claude", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Api-Key": "..." },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: "Draft a LinkedIn reply" }],
  }),
});`,
            },
            {
              method: "POST",
              path: "/api/public/gemini",
              provider: "Google Generative Language API",
              note: "Pass model, action, and payload. Supports generateContent, streamGenerateContent, countTokens, embedContent. Requires X-Api-Key header.",
              sample: `fetch("https://YOUR-INSTANCE.lovable.app/api/public/gemini", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Api-Key": "..." },
  body: JSON.stringify({
    model: "gemini-3.1-flash-image-preview",
    action: "generateContent",
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    contents: [{ parts: [{ text: "Professional LinkedIn post image" }] }],
  }),
});`,
            },
            {
              method: "GET",
              path: "/api/public/health",
              provider: "Status check",
              note: "Returns configured providers, version, and whether auth is required. No API key needed.",
              sample: `fetch("https://YOUR-INSTANCE.lovable.app/api/public/health")
  .then(r => r.json())
  .then(console.log);
// { status: "ok", version: "1.0.0", providers: { claude: true, gemini: true }, authRequired: true }`,
            },
          ].map((ep) => (
            <article
              key={ep.path}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              style={{ boxShadow: "var(--shadow-panel)" }}
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
                <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  {ep.method}
                </span>
                <code className="text-sm font-semibold text-slate-800">{ep.path}</code>
                <span className="text-xs text-slate-400">{ep.provider}</span>
              </div>
              <p className="px-5 pt-4 text-sm text-slate-500">{ep.note}</p>
              <pre className="mt-4 overflow-x-auto border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-700">
                <code>{ep.sample}</code>
              </pre>
            </article>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-800">Secured by API key</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-700">
            These endpoints require an{" "}
            <code className="rounded bg-amber-200 px-1 text-xs font-semibold">X-Api-Key</code>{" "}
            header when{" "}
            <code className="rounded bg-amber-200 px-1 text-xs font-semibold">API_KEYS</code> is set
            on the server. Add your key in the extension settings under "Proxy API Key" to
            authenticate. Without a valid key, the endpoints return 401.
          </p>
        </section>
      </section>
    </main>
  );
}

export function AppChrome({
  children,
  active = "Overview",
  usageTotals,
}: {
  children: ReactNode;
  active?: string;
  usageTotals?: {
    connections_sent: number;
    comments_made: number;
    posts_created: number;
    messages_sent: number;
    messages_received: number;
  };
}) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const name = profile?.display_name ?? user?.email ?? "Account";
  const avatar =
    profile?.avatar_url ??
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  const planName = profile?.plan ?? "Free";
  const planAllowance = planName.toLowerCase().includes("pro") ? 25000 : 5000;
  const usedActions = usageTotals
    ? usageTotals.connections_sent +
      usageTotals.comments_made +
      usageTotals.posts_created +
      usageTotals.messages_sent +
      usageTotals.messages_received
    : 0;
  const usagePercent = Math.min(100, Math.round((usedActions / planAllowance) * 100));
  const unreadAlerts = 0;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <main className="page-shell">
      <section className="panel mx-auto min-h-[calc(100vh-48px)] max-w-[1500px] overflow-hidden">
        <div className="app">
          <aside>
            <div>
              <Logo />
              <nav className="sidebar-nav" aria-label="Main navigation">
                {nav.map(([item, to, Icon]) => (
                  <Link to={to} className={`nav ${active === item ? "on" : ""}`} key={item}>
                    <Icon className="h-4 w-4" />
                    <span>{item}</span>
                    {item === "Reports" && unreadAlerts > 0 ? <small>{unreadAlerts}</small> : null}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="sidebar-bottom">
              <div className="user-card">
                <img alt={`${name} avatar`} src={avatar} />
                <span>
                  <b>{name}</b>
                  <em>{planName} Plan</em>
                  <button type="button" onClick={handleSignOut}>
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </span>
              </div>
              <div className="plan-card">
                <div>
                  <b>Plan usage</b>
                  <em>{planName} Plan</em>
                </div>
                <div className="usage-track">
                  <span style={{ width: `${usagePercent}%` }} />
                </div>
                <p>
                  {usedActions.toLocaleString()} / {planAllowance.toLocaleString()} actions
                </p>
                <button type="button">
                  <AlertCircle className="h-3.5 w-3.5" /> Upgrade Plan
                </button>
              </div>
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </section>
    </main>
  );
}

export function DashboardPage() {
  return (
    <AppChrome>
      <div className="topbar">
        <div>
          <h2>Overview</h2>
          <p>Your LinkedIn automation command center.</p>
        </div>
        <Button>New Campaign</Button>
      </div>
      <div className="analytics-metrics">
        {metrics.map((m) => (
          <div className="metric" key={m[0]}>
            <span>{m[0]}</span>
            <b>{m[1]}</b>
            <em>{m[2]}</em>
          </div>
        ))}
      </div>
      <div className="chart-card mt-4">
        <b>Performance Overview</b>
        <Chart />
      </div>
    </AppChrome>
  );
}

export function PipelinePage() {
  return (
    <AppChrome active="Campaigns">
      <div className="topbar">
        <div>
          <h2>Pipeline</h2>
          <p>Track every lead and conversation across your outreach journey.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft">All Campaigns</Button>
          <Button variant="soft">
            <Filter className="h-3 w-3" />
            Filters
          </Button>
          <Button variant="soft">
            <Search className="h-3 w-3" />
            Search leads...
          </Button>
          <Button>Add Lead</Button>
        </div>
      </div>
      <div className="kanban">
        {columns.map((column, ci) => (
          <div className="lane" key={column}>
            <b>
              {column}
              <span>{Math.floor(170 + ci * 166)}</span>
            </b>
            {[0, 1, 2].map((_, i) => (
              <div className="lead" key={i}>
                <img
                  alt={`${names[ci * 3 + i]} avatar`}
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${names[ci * 3 + i]}`}
                />
                <span>
                  {names[ci * 3 + i]}
                  <em>{["Growth Marketer", "Founder", "Product Manager"][i]}</em>
                </span>
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="lower">
        <div className="attention">
          <b>Unread / Unreplied</b>
          <strong>87</strong>
          <span>Leads need your attention</span>
          <Button variant="soft">View All</Button>
        </div>
        <div className="conversation">
          <b>Lead Conversation</b>
          <div className="bubble blue">Yo — can you share your thoughts on product-led growth?</div>
          <div className="bubble">Thanks! Sure, happy to connect.</div>
        </div>
        <table>
          <tbody>
            {names.slice(6, 10).map((n) => (
              <tr key={n}>
                <td>{n}</td>
                <td>Growth Outreach</td>
                <td>
                  <span className="tag">AI Generated</span>
                </td>
                <td>Follow-up today</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppChrome>
  );
}

export function AnalyticsPage() {
  return (
    <AppChrome active="Analytics">
      <div className="topbar">
        <div>
          <h2>Activity & Analytics</h2>
          <p>Monitor automation activity, performance and outcomes in real time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft">May 5 – May 11, 2024</Button>
          <Button variant="soft">All Campaigns</Button>
          <Button variant="soft">
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>
      <div className="analytics-metrics">
        {metrics.map((m, i) => (
          <div className="metric" key={m[0]}>
            {[Send, MessageCircle, FileText, Inbox, CheckCircle2].map((Icon, idx) =>
              idx === i ? <Icon key={idx} className="h-5 w-5 text-blue-600" /> : null,
            )}
            <span>{m[0]}</span>
            <b>{m[1]}</b>
            <em>{m[2]}</em>
          </div>
        ))}
      </div>
      <div className="analytics-grid">
        <div className="table-card">
          <b>7-Day Activity (Rolling)</b>
          {["May 11", "May 10", "May 9", "May 8", "May 7", "May 6", "May 5"].map((d, i) => (
            <p key={d}>
              <span>{d}</span>
              <span>{326 - i * 15}</span>
              <span>{152 - i * 7}</span>
              <span>{22 - i}</span>
              <span>{178 - i * 8}</span>
            </p>
          ))}
        </div>
        <div className="chart-card">
          <b>Performance Overview</b>
          <Chart />
        </div>
        <div className="health">
          <b>Automation Health</b>
          <div className="donut">
            96.8%<span>Success Rate</span>
          </div>
          <p>
            Successful <strong>96.8%</strong>
          </p>
          <p>
            Skipped / Dedup <strong>1.9%</strong>
          </p>
          <p>
            Failed <strong>1.3%</strong>
          </p>
        </div>
      </div>
      <div className="summary-row">
        {["Today's Summary", "Content & Engagement", "Quality & Safety", "Top Campaigns"].map(
          (x) => (
            <div className="summary" key={x}>
              <b>{x}</b>
              <p>
                Processed Today <strong>284</strong>
              </p>
              <p>
                Remaining Quota <strong>72%</strong>
              </p>
            </div>
          ),
        )}
      </div>
    </AppChrome>
  );
}
