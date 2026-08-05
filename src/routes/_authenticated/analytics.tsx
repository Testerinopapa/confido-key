import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle, FileText, Inbox, CheckCircle2 } from "lucide-react";
import { AppChrome } from "../-audience-ui";

function Analytics() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data } = await supabase.from("daily_activity").select("*").order("date", { ascending: false }).limit(14);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const { data: leadCount } = useQuery({
    queryKey: ["lead-count"],
    queryFn: async () => {
      const { count } = await supabase.from("leads").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  if (isLoading) return <AppChrome active="Analytics"><div className="p-8 text-slate-500">Loading...</div></AppChrome>;

  const totals = (activity ?? []).reduce((acc, r) => ({
    connections_sent: acc.connections_sent + r.connections_sent,
    comments_made: acc.comments_made + r.comments_made,
    posts_created: acc.posts_created + r.posts_created,
    messages_sent: acc.messages_sent + r.messages_sent,
    messages_received: acc.messages_received + r.messages_received,
  }), { connections_sent: 0, comments_made: 0, posts_created: 0, messages_sent: 0, messages_received: 0 });

  return (
    <AppChrome active="Analytics">
      <div className="topbar">
        <div>
          <h2>Activity & Analytics</h2>
          <p>Monitor automation activity, performance and outcomes in real time.</p>
        </div>
      </div>
      <div className="analytics-metrics">
        <div className="metric"><Send className="h-5 w-5 text-blue-600" /><span>Connections Sent</span><b>{totals.connections_sent}</b><em>{leadCount} leads</em></div>
        <div className="metric"><MessageCircle className="h-5 w-5 text-blue-600" /><span>Comments Made</span><b>{totals.comments_made}</b><em>Total</em></div>
        <div className="metric"><FileText className="h-5 w-5 text-blue-600" /><span>Posts Created</span><b>{totals.posts_created}</b><em>Total</em></div>
        <div className="metric"><Inbox className="h-5 w-5 text-blue-600" /><span>Messages Sent</span><b>{totals.messages_sent}</b><em>Total</em></div>
        <div className="metric"><CheckCircle2 className="h-5 w-5 text-blue-600" /><span>Replies Received</span><b>{totals.messages_received}</b><em>Total</em></div>
      </div>
      <div className="table-card mt-6">
        <b>7-Day Activity (Rolling)</b>
        {(activity ?? []).slice(0, 7).map(row => (
          <p key={row.date}>
            <span>{row.date}</span>
            <span>{row.connections_sent}</span>
            <span>{row.comments_made}</span>
            <span>{row.posts_created}</span>
            <span>{row.messages_sent}</span>
          </p>
        ))}
        {(activity ?? []).length === 0 && (
          <p className="text-sm text-slate-400 mt-2">No activity recorded yet. Start the extension to begin tracking.</p>
        )}
      </div>
    </AppChrome>
  );
}

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Activity & Analytics — AudiencePilot" },
      { name: "description", content: "Monitor automation activity, performance and outcomes in real time." },
      { property: "og:title", content: "Activity & Analytics — AudiencePilot" },
      { property: "og:description", content: "Rolling activity, automation health and campaign performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});
