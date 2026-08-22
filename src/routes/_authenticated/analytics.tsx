import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  HelpCircle,
  Inbox,
  MessageCircle,
  Send,
  Target,
  Users,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppChrome } from "../-audience-ui";

type ActivityRow = Tables<"daily_activity">;
type LeadRow = Tables<"leads">;
type MessageRow = Tables<"messages"> & { leads?: Pick<LeadRow, "name" | "status"> | null };
type DateRange = "7" | "14" | "30";
type MetricKey =
  "connections_sent" | "comments_made" | "posts_created" | "messages_sent" | "messages_received";

type MetricDefinition = {
  key: MetricKey;
  label: string;
  color: string;
  bg: string;
  icon: ReactNode;
};

const METRICS: MetricDefinition[] = [
  {
    key: "connections_sent",
    label: "Connections Sent",
    color: "#2563eb",
    bg: "#eaf2ff",
    icon: <Send className="h-5 w-5" />,
  },
  {
    key: "comments_made",
    label: "Comments Made",
    color: "#8b5cf6",
    bg: "#f1eaff",
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    key: "posts_created",
    label: "Posts Created",
    color: "#16a34a",
    bg: "#e9f9ef",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: "messages_sent",
    label: "Messages Sent",
    color: "#f97316",
    bg: "#fff1e6",
    icon: <Inbox className="h-5 w-5" />,
  },
  {
    key: "messages_received",
    label: "Replies Received",
    color: "#ec407a",
    bg: "#ffe8f0",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
];

const metricLabels = Object.fromEntries(
  METRICS.map((metric) => [metric.key, metric.label]),
) as Record<MetricKey, string>;

function sumRows(rows: ActivityRow[]) {
  return rows.reduce(
    (acc, row) => ({
      connections_sent: acc.connections_sent + row.connections_sent,
      comments_made: acc.comments_made + row.comments_made,
      posts_created: acc.posts_created + row.posts_created,
      messages_sent: acc.messages_sent + row.messages_sent,
      messages_received: acc.messages_received + row.messages_received,
    }),
    {
      connections_sent: 0,
      comments_made: 0,
      posts_created: 0,
      messages_sent: 0,
      messages_received: 0,
    } satisfies Record<MetricKey, number>,
  );
}

function parseDateValue(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00`)
    : new Date(date);
}

function formatDateLabel(date: string) {
  return parseDateValue(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function changeLabel(current: number, previous: number, hasPrevious: boolean) {
  if (!hasPrevious) {
    return { tone: "neutral", percent: null as number | null, text: "No comparison data" };
  }
  if (current === 0 && previous === 0) {
    return { tone: "neutral", percent: 0, text: "0% vs previous period" };
  }
  if (previous === 0) return { tone: "positive", percent: 100, text: "100% vs previous period" };
  const percent = Math.round(((current - previous) / previous) * 100);
  return {
    tone: percent > 0 ? "positive" : percent < 0 ? "negative" : "neutral",
    percent,
    text: `${Math.abs(percent)}% vs previous period`,
  };
}

function buildSparklinePoints(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length < 2) return "";

  const width = 72;
  const height = 28;
  const chartPadding = 3;
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const padding = Math.max((max - min) * 0.15, 0.5);
  const domainMin = Math.max(0, min - padding);
  const domainMax = max + padding;
  const domainRange = domainMax - domainMin || 1;
  const innerWidth = width - chartPadding * 2;
  const innerHeight = height - chartPadding * 2;

  return values
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : chartPadding + (index / (values.length - 1)) * innerWidth;
      const normalized = (value - domainMin) / domainRange;
      const y = height - chartPadding - normalized * innerHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function MetricCard({
  metric,
  value,
  previous,
  hasPrevious,
  sparkline,
}: {
  metric: MetricDefinition;
  value: number;
  previous: number;
  hasPrevious: boolean;
  sparkline: number[];
}) {
  const trend = changeLabel(value, previous, hasPrevious);
  const Icon =
    trend.tone === "negative" ? ArrowDown : trend.tone === "positive" ? ArrowUp : ArrowRight;
  const validPointCount = sparkline.filter((point) => Number.isFinite(point)).length;
  const points = buildSparklinePoints(sparkline);

  return (
    <article className="analytics-card metric-card">
      <div className="metric-card-top">
        <span className="metric-icon" style={{ backgroundColor: metric.bg, color: metric.color }}>
          {metric.icon}
        </span>
        <span className="metric-label">{metric.label}</span>
      </div>
      <div className="metric-value">{value.toLocaleString()}</div>
      <div className="metric-footer">
        <div className={`metric-trend ${trend.tone}`} aria-label={trend.text}>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {trend.percent === null ? (
            <span>{trend.text}</span>
          ) : (
            <span>
              <b>{Math.abs(trend.percent)}%</b> <em>vs previous period</em>
            </span>
          )}
        </div>
        <div className="metric-sparkline-box" aria-hidden="true">
          {validPointCount > 1 && points ? (
            <svg className="metric-sparkline" viewBox="0 0 72 28" preserveAspectRatio="none">
              <polyline
                points={points}
                fill="none"
                stroke={metric.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : validPointCount === 1 ? (
            <span className="metric-sparkline-dot" style={{ backgroundColor: metric.color }} />
          ) : (
            <span className="metric-sparkline-empty" />
          )}
        </div>
      </div>
    </article>
  );
}

function AnalyticsHeader({
  range,
  onRangeChange,
  onExport,
  canExport,
}: {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  onExport: () => void;
  canExport: boolean;
}) {
  return (
    <header className="analytics-header">
      <div>
        <h2>Activity & Analytics</h2>
        <p>Monitor automation activity, performance and outcomes in real time.</p>
      </div>
      <div className="analytics-actions">
        <label className="range-select">
          <CalendarDays className="h-4 w-4" />
          <select
            value={range}
            onChange={(event) => onRangeChange(event.target.value as DateRange)}
            aria-label="Date range"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <ChevronDown className="h-4 w-4" />
        </label>
        <button
          className="export-button"
          type="button"
          onClick={onExport}
          disabled={!canExport}
          title={
            canExport
              ? "Export currently loaded analytics as CSV"
              : "No analytics data available to export"
          }
        >
          <Download className="h-4 w-4" /> Export report
        </button>
      </div>
    </header>
  );
}

function ActivityOverview({ rows }: { rows: ActivityRow[] }) {
  const chartData = rows.map((row) => ({ ...row, date: formatDateLabel(row.date) }));
  const hasHistory = chartData.length >= 2;
  return (
    <article className="analytics-card activity-overview">
      <div className="card-title-row">
        <h3>
          Activity Overview{" "}
          <HelpCircle
            className="h-4 w-4 text-slate-400"
            aria-label="Daily activity from synced automation records"
          />
        </h3>
        <button
          className="segmented-button"
          type="button"
          disabled
          title="Daily grouping is based on the available daily activity table"
        >
          Daily <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="chart-legend" aria-label="Chart legend">
        {METRICS.map((metric) => (
          <span key={metric.key}>
            <i style={{ backgroundColor: metric.color }} />
            {metric.label}
          </span>
        ))}
      </div>
      {hasHistory ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 18, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#dbe5f2" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value, name) => [value, metricLabels[name as MetricKey] ?? name]}
                contentStyle={{ borderRadius: 12, border: "1px solid #dbe5f2" }}
              />
              {METRICS.map((metric) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.key}
                  stroke={metric.color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="limited-state">
          <FileText className="h-8 w-8" />
          <b>Daily historical data is limited</b>
          <p>
            At least two synced activity days are needed to draw a trend line. Aggregate totals
            above still use your real records.
          </p>
        </div>
      )}
    </article>
  );
}

function RecentActivity({ rows, messages }: { rows: ActivityRow[]; messages: MessageRow[] }) {
  const activityItems = [
    ...messages.slice(0, 4).map((message) => ({
      id: message.id,
      icon: message.direction === "inbound" ? <CheckCircle2 /> : <Inbox />,
      title:
        message.direction === "inbound"
          ? `Reply received${message.leads?.name ? ` from ${message.leads.name}` : ""}`
          : `Message sent${message.leads?.name ? ` to ${message.leads.name}` : ""}`,
      subtitle: message.leads?.status ? `Lead status: ${message.leads.status}` : "LinkedIn message",
      date: message.created_at,
      tone: message.direction === "inbound" ? "pink" : "orange",
    })),
    ...rows
      .flatMap((row) =>
        METRICS.filter((metric) => row[metric.key] > 0).map((metric) => ({
          id: `${row.id}-${metric.key}`,
          icon: metric.icon,
          title: `${metric.label}: ${row[metric.key].toLocaleString()}`,
          subtitle: "Synced daily activity",
          date: row.date,
          tone: metric.key,
        })),
      ),
  ]
    .sort((a, b) => parseDateValue(b.date).getTime() - parseDateValue(a.date).getTime())
    .slice(0, 5);
  return (
    <article className="analytics-card recent-activity">
      <div className="card-title-row">
        <h3>Recent Activity</h3>
        <Link to="/analytics">View all</Link>
      </div>
      {activityItems.length ? (
        activityItems.map((item) => (
          <div className="activity-item" key={item.id}>
            <span className={`activity-icon ${item.tone}`}>{item.icon}</span>
            <span>
              <b>{item.title}</b>
              <em>{item.subtitle}</em>
            </span>
            <time>
              {parseDateValue(item.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <Inbox className="h-8 w-8" />
          <b>No recent activity yet</b>
          <p>Start the extension to sync connections, comments, posts, messages and replies.</p>
        </div>
      )}
    </article>
  );
}

function ConversionFunnel({
  totals,
  qualifiedLeads,
}: {
  totals: Record<MetricKey, number>;
  qualifiedLeads: number | null;
}) {
  const replyPct =
    totals.connections_sent > 0
      ? Math.round((totals.messages_received / totals.connections_sent) * 100)
      : 0;
  return (
    <article className="analytics-card bottom-card">
      <h3>
        Conversion Funnel <HelpCircle className="h-4 w-4 text-slate-400" />
      </h3>
      <div className="funnel">
        <div>
          <Users />
          <b>{totals.connections_sent}</b>
          <span>Connections</span>
          <em>100%</em>
        </div>
        <ArrowRight />
        <div>
          <MessageCircle />
          <b>{totals.messages_received}</b>
          <span>Replies</span>
          <em>{replyPct}%</em>
        </div>
        <ArrowRight />
        <div>
          <Target />
          <b>{qualifiedLeads ?? "—"}</b>
          <span>Qualified Leads</span>
          <em>{qualifiedLeads === null ? "Unavailable" : `${replyPct}%`}</em>
        </div>
      </div>
      <p>
        Your conversion rate is <strong>{replyPct}%</strong>
      </p>
    </article>
  );
}

function ResponseRateCard({ replies, messages }: { replies: number; messages: number }) {
  const rate = messages > 0 ? Math.round((replies / messages) * 100) : 0;
  return (
    <article className="analytics-card bottom-card response-card">
      <h3>
        Response Rate <HelpCircle className="h-4 w-4 text-slate-400" />
      </h3>
      <strong>{rate}%</strong>
      <p>
        {replies === 0
          ? "No replies received yet"
          : `${replies.toLocaleString()} replies from ${messages.toLocaleString()} sent messages.`}
      </p>
      <div className="response-note">
        Your campaigns have sent {messages.toLocaleString()} messages. Replies will appear here when
        received.
      </div>
    </article>
  );
}

function TopCampaignCard({
  leads,
  totals,
}: {
  leads: LeadRow[];
  totals: Record<MetricKey, number>;
}) {
  const activeLeads = leads.filter((lead) => lead.status !== "archived");
  const hasActivity = totals.connections_sent + totals.messages_sent + totals.messages_received > 0;
  if (!hasActivity)
    return (
      <article className="analytics-card bottom-card">
        <h3>Top Performing Campaign</h3>
        <div className="empty-state">
          <Target className="h-8 w-8" />
          <b>No campaign activity yet</b>
          <p>Campaign performance will appear after synced outreach activity exists.</p>
        </div>
      </article>
    );
  const replyRate =
    totals.messages_sent > 0
      ? Math.round((totals.messages_received / totals.messages_sent) * 100)
      : 0;
  return (
    <article className="analytics-card bottom-card top-campaign">
      <h3>
        Top Performing Campaign <HelpCircle className="h-4 w-4 text-slate-400" />
      </h3>
      <div className="campaign-head">
        <span className="metric-icon">
          <Target className="h-5 w-5" />
        </span>
        <b>All tracked outreach</b>
        <em>Active</em>
      </div>
      <div className="campaign-stats">
        <span>
          Connections<b>{totals.connections_sent}</b>
        </span>
        <span>
          Messages<b>{totals.messages_sent}</b>
        </span>
        <span>
          Replies<b>{totals.messages_received}</b>
        </span>
        <span>
          Reply Rate<b>{replyRate}%</b>
        </span>
      </div>
      <Link className="report-link" to="/pipeline">
        View campaign report <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="data-note">
        Campaign-level analytics are limited; this card summarizes {activeLeads.length} active
        tracked leads.
      </p>
    </article>
  );
}

function Analytics() {
  const [range, setRange] = useState<DateRange>("30");
  const days = Number(range);
  const {
    data: activity = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_activity")
        .select("*")
        .order("date", { ascending: false })
        .limit(days * 2);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["analytics-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: messages = [] } = useQuery({
    queryKey: ["analytics-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, leads(name, status)")
        .order("created_at", { ascending: false })
        .limit(12);
      return (data ?? []) as MessageRow[];
    },
    refetchInterval: 30_000,
  });
  const sorted = useMemo(
    () => [...activity].sort((a, b) => a.date.localeCompare(b.date)),
    [activity],
  );
  const currentRows = sorted.slice(-days);
  const previousRows = sorted.slice(
    Math.max(0, sorted.length - days * 2),
    Math.max(0, sorted.length - days),
  );
  const totals = sumRows(currentRows);
  const previousTotals = sumRows(previousRows);
  const hasPrevious = previousRows.length > 0;

  function exportCsv() {
    const headers = ["date", ...METRICS.map((metric) => metric.key)];
    const csv = [
      headers.join(","),
      ...currentRows.map((row) => headers.map((key) => row[key as keyof ActivityRow]).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audiencepilot-analytics-${range}-days.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading)
    return (
      <AppChrome active="Analytics">
        <div className="analytics-page">
          <div className="p-8 text-slate-500">Loading analytics...</div>
        </div>
      </AppChrome>
    );
  if (isError)
    return (
      <AppChrome active="Analytics">
        <div className="analytics-page">
          <div className="empty-state">Unable to load analytics right now.</div>
        </div>
      </AppChrome>
    );

  return (
    <AppChrome active="Analytics" usageTotals={totals}>
      <div className="analytics-page">
        <AnalyticsHeader
          range={range}
          onRangeChange={setRange}
          onExport={exportCsv}
          canExport={currentRows.length > 0}
        />
        <section className="kpi-grid">
          {METRICS.map((metric) => (
            <MetricCard
              key={metric.key}
              metric={metric}
              value={totals[metric.key]}
              previous={previousTotals[metric.key]}
              hasPrevious={hasPrevious}
              sparkline={currentRows.map((row) => row[metric.key])}
            />
          ))}
        </section>
        <section className="overview-grid">
          <ActivityOverview rows={currentRows} />
          <RecentActivity rows={currentRows} messages={messages} />
        </section>
        <section className="bottom-grid">
          <ConversionFunnel totals={totals} qualifiedLeads={null} />
          <ResponseRateCard replies={totals.messages_received} messages={totals.messages_sent} />
          <TopCampaignCard leads={leads} totals={totals} />
        </section>
      </div>
    </AppChrome>
  );
}

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Activity & Analytics — AudiencePilot" },
      {
        name: "description",
        content: "Monitor automation activity, performance and outcomes in real time.",
      },
      { property: "og:title", content: "Activity & Analytics — AudiencePilot" },
      {
        property: "og:description",
        content: "Rolling activity, automation health and campaign performance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});
