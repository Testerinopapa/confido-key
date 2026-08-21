import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppChrome } from "../-audience-ui";

function Settings() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateCode() {
    setLoading(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session has expired. Please sign in again.");

      const response = await fetch("/api/extension/code", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to generate a code.");
      setCode(result.code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to generate a code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppChrome active="Settings">
      <div className="topbar">
        <div>
          <h2>Settings</h2>
          <p>Configure the extension directly from its Options page.</p>
        </div>
      </div>

      <div className="chart-card mt-4">
        <b>Extension connection</b>
        <p className="mt-1 text-sm text-slate-500">
          Generate a one-time code and enter it in the extension Options page to link this browser
          to your account. The code expires after 10 minutes.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          onClick={generateCode}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate extension code"}
        </button>
        {code && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Your code</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-blue-900">{code}</p>
            <p className="mt-1 text-xs text-blue-700">Enter this code in the extension within 10 minutes.</p>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </AppChrome>
  );
}

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AudiencePilot" },
      { name: "description", content: "Configure the AudiencePilot extension." },
    ],
  }),
  component: Settings,
});
