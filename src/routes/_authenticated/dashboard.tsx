import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle, FileText, Inbox, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { AppChrome } from "../-audience-ui";

function StatCard({ icon, label, value, change }: { icon: ReactNode; label: string; value: string; change: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value}</b>
      <em>{change}</em>
    </div>
  );
}

function Dashboard() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await supabase.from("daily_activity").select("*").order("date", { ascending: false }).limit(30);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const { data: leads } = useQuery({
    queryKey: ["pipeline-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("status");
      return data ?? [];
    },
  });

  if (isLoading) return <AppChrome><div className="p-8 text-slate-500">Loading...</div></AppChrome>;

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = activity?.find(r => r.date === today);
  const totals = (activity ?? []).reduce((acc, r) => ({
    connections_sent: acc.connections_sent + r.connections_sent,
    comments_made: acc.comments_made + r.comments_made,
    posts_created: acc.posts_created + r.posts_created,
    messages_sent: acc.messages_sent + r.messages_sent,
    messages_received: acc.messages_received + r.messages_received,
  }), { connections_sent: 0, comments_made: 0, posts_created: 0, messages_sent: 0, messages_received: 0 });

  return (
    <AppChrome usageTotals={totals}>
      <div className="topbar">
        <div>
          <h2>Overview</h2>
          <p>Your LinkedIn automation command center.</p>
        </div>
        <div>
          <span className="text-sm text-slate-400">{leads?.length ?? 0} leads tracked</span>
        </div>
      </div>
      <div className="analytics-metrics">
        <StatCard icon={<Send className="h-5 w-5 text-blue-600" />} label="Connections Sent" value={String(totals.connections_sent)} change="Last 30 days" />
        <StatCard icon={<MessageCircle className="h-5 w-5 text-blue-600" />} label="Comments Made" value={String(totals.comments_made)} change="Last 30 days" />
        <StatCard icon={<FileText className="h-5 w-5 text-blue-600" />} label="Posts Created" value={String(totals.posts_created)} change="Last 30 days" />
        <StatCard icon={<Inbox className="h-5 w-5 text-blue-600" />} label="Messages Sent" value={String(totals.messages_sent)} change="Last 30 days" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />} label="Replies Received" value={String(totals.messages_received)} change="Last 30 days" />
      </div>
      <div className="chart-card mt-4">
        <b>Today's Activity</b>
        {todayRow ? (
          <div className="grid grid-cols-5 gap-4 mt-4 text-center">
            <div><b className="text-2xl text-blue-600">{todayRow.connections_sent}</b><p className="text-xs text-slate-500">Connections</p></div>
            <div><b className="text-2xl text-blue-600">{todayRow.comments_made}</b><p className="text-xs text-slate-500">Comments</p></div>
            <div><b className="text-2xl text-blue-600">{todayRow.posts_created}</b><p className="text-xs text-slate-500">Posts</p></div>
            <div><b className="text-2xl text-blue-600">{todayRow.messages_sent}</b><p className="text-xs text-slate-500">Sent</p></div>
            <div><b className="text-2xl text-blue-600">{todayRow.messages_received}</b><p className="text-xs text-slate-500">Received</p></div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No activity today. Start the extension to begin tracking.</p>
        )}
      </div>
    </AppChrome>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AudiencePilot" },
      { name: "description", content: "Your LinkedIn automation command center: outreach metrics and performance." },
      { property: "og:title", content: "Dashboard — AudiencePilot" },
      { property: "og:description", content: "Track connections, comments, posts and replies in one dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
