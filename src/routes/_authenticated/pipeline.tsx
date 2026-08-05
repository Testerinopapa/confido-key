import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MoreHorizontal } from "lucide-react";
import { AppChrome } from "../-audience-ui";

const COLUMNS = ["new", "connected", "messaged", "replied", "followup_due", "archived"] as const;
const LABELS: Record<string, string> = { new: "New", connected: "Connected", messaged: "Messaged", replied: "Replied", followup_due: "Follow-up Due", archived: "Archived" };

function Pipeline() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["pipeline"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").order("updated_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  if (isLoading) return <AppChrome><div className="p-8 text-slate-500">Loading...</div></AppChrome>;

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = (leads ?? []).filter(l => l.status === col);
    return acc;
  }, {} as Record<string, typeof leads>);

  const unreplied = (leads ?? []).filter(l => l.status === "messaged");

  return (
    <AppChrome active="Campaigns">
      <div className="topbar">
        <div>
          <h2>Pipeline</h2>
          <p>Track every lead and conversation across your outreach journey.</p>
        </div>
        <div className="text-sm text-slate-400">{(leads ?? []).length} leads</div>
      </div>
      <div className="kanban">
        {COLUMNS.map(column => (
          <div className="lane" key={column}>
            <b>{LABELS[column]}<span>{grouped[column]?.length ?? 0}</span></b>
            {(grouped[column] ?? []).slice(0, 6).map(lead => (
              <div className="lead" key={lead.id}>
                <img alt={lead.name} src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(lead.name)}`} />
                <span>
                  {lead.name}
                  <em>{lead.headline || "LinkedIn User"}</em>
                </span>
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ))}
            {(grouped[column]?.length ?? 0) === 0 && (
              <p className="text-xs text-slate-400 py-3 px-2">No leads</p>
            )}
          </div>
        ))}
      </div>
      {unreplied.length > 0 && (
        <div className="lower mt-8">
          <div className="attention">
            <b>Unread / Unreplied</b>
            <strong>{unreplied.length}</strong>
            <span>Leads need your attention</span>
          </div>
          <table>
            <tbody>
              {unreplied.slice(0, 5).map(lead => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.headline || ""}</td>
                  <td><span className="tag">Needs Reply</span></td>
                  <td>{new Date(lead.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppChrome>
  );
}

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — AudiencePilot" },
      { name: "description", content: "Track every lead and conversation across your outreach journey." },
      { property: "og:title", content: "Pipeline — AudiencePilot" },
      { property: "og:description", content: "Kanban lead tracking from first connection to follow-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pipeline,
});
