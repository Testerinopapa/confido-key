import type { ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Filter,
  Globe2,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
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
  ["Overview", "/dashboard"],
  ["Activity", "/analytics"],
  ["Analytics", "/analytics"],
  ["Campaigns", "/pipeline"],
  ["Reports", "/analytics"],
  ["Alerts", "/dashboard"],
  ["Settings", "/settings"],
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
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "soft";
}) {
  return <button className={`btn ${variant}`}>{children}</button>;
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

export function LandingPage() {
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
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
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
            "Automation Modes",
            "Auto-Comment",
            "Auto-Post",
            "Auto-Reply (DM)",
            "AI-Powered Pipeline",
            "Gemini for Images",
            "Three-Tier Fallback",
            "Secure Server-Side",
          ].map((title, i) => (
            <div className="feature" key={title}>
              <span className="icon">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <b>{title}</b>
              <p>
                {i < 4
                  ? "Engage with relevant posts using AI-powered contextual prompts."
                  : "Smart templates, secure execution, and encrypted vault storage."}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function AppChrome({
  children,
  active = "Overview",
}: {
  children: ReactNode;
  active?: string;
}) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const name = profile?.display_name ?? user?.email ?? "Account";
  const avatar =
    profile?.avatar_url ??
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

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
            <Logo />
            {nav.map(([item, to]) => (
              <Link to={to} className={`nav ${active === item ? "on" : ""}`} key={item}>
                <LayoutDashboard className="h-4 w-4" />
                {item}
              </Link>
            ))}
            <div className="user">
              <img alt={`${name} avatar`} src={avatar} />
              <span>
                {name}
                <br />
                <em>{profile?.plan ?? "Free"} Plan</em>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
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

export function SettingsPage() {
  return (
    <AppChrome active="Settings">
      <div className="flex items-start justify-between">
        <div>
          <h2>Settings</h2>
          <p>Configure automation behavior, limits, content and scheduling.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft">
            <Upload className="h-3 w-3" />
            Import
          </Button>
          <Button variant="soft">
            <Download className="h-3 w-3" />
            Export
          </Button>
          <Button>Save Changes</Button>
        </div>
      </div>
      <h3>Daily Limits & Speed</h3>
      <div className="settings-grid">
        {[
          "Daily connection limit",
          "Speed preset",
          "Session duration cap",
          "Connection note",
          "Randomization",
          "Smart dedup",
          "Keyword / Hashtag",
          "Topic / Niche",
          "Intervals",
          "Reply pool",
          "Delay range",
          "Daily Campaigns",
        ].map((x, i) => (
          <div className={i === 3 || i === 11 ? "setting wide" : "setting"} key={x}>
            <b>{x}</b>
            <div className="input-fake">
              {i % 3 === 0 ? "100" : i % 3 === 1 ? "Normal" : "60 minutes"}
            </div>
          </div>
        ))}
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
