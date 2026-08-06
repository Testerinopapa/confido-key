import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Plus, Trash2 } from "lucide-react";
import { AppChrome } from "../-audience-ui";

function Settings() {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function createKey() {
    if (!newName.trim()) return;
    setCreating(true);
    const key = "sk-" + crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    const { error } = await supabase.from("api_keys").insert({ name: newName.trim(), key, user_id: (await supabase.auth.getUser()).data.user!.id });
    if (!error) {
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    await supabase.from("api_keys").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["api-keys"] });
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AppChrome active="Settings">
      <div className="topbar">
        <div>
          <h2>Settings</h2>
          <p>Manage API keys, automation limits, and extension configuration.</p>
        </div>
      </div>

      <div className="chart-card mt-4">
        <b>Extension API Keys</b>
        <p className="text-sm text-slate-500 mt-1">
          Generate a personal key and paste it into the extension's Settings tab under "Proxy API Key".
          This ties your extension data to your account.
        </p>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Key name (e.g. Laptop, Work PC)"
            className="input-fake flex-1"
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px" }}
            onKeyDown={e => e.key === "Enter" && createKey()}
          />
          <button className="btn primary" onClick={createKey} disabled={creating || !newName.trim()}>
            <Plus className="h-4 w-4" /> Generate Key
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400 mt-4">Loading...</p>
        ) : (keys ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 mt-4">No API keys yet. Generate one above.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {(keys ?? []).map(k => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{k.name}</p>
                  <code className="text-xs text-slate-500">{k.key.slice(0, 10)}...{k.key.slice(-8)}</code>
                  {k.last_used_at && (
                    <span className="text-xs text-slate-400 ml-2">
                      Last used: {new Date(k.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn ghost"
                    onClick={() => copyKey(k.key)}
                    title="Copy key"
                  >
                    {copied === k.key ? "Copied!" : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => revokeKey(k.id)}
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppChrome>
  );
}

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AudiencePilot" },
      { name: "description", content: "Manage API keys and extension configuration." },
    ],
  }),
  component: Settings,
});
