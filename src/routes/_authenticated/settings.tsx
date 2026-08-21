import { createFileRoute } from "@tanstack/react-router";
import { AppChrome } from "../-audience-ui";

function Settings() {
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
          The extension syncs activity using its local device ID. No service API key is required.
          Open the extension Options page to change its service URL or automation settings.
        </p>
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
