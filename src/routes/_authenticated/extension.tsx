import { createFileRoute } from "@tanstack/react-router";
import { AppChrome, ExtensionDownload } from "../-audience-ui";

function ExtensionPage() {
  return (
    <AppChrome active="Extension">
      <div className="topbar">
        <div>
          <h2>Chrome Extension</h2>
          <p>Download and install the AudiencePilot extension — no API keys required.</p>
        </div>
      </div>
      <ExtensionDownload />
    </AppChrome>
  );
}

export const Route = createFileRoute("/_authenticated/extension")({
  head: () => ({
    meta: [
      { title: "Download Extension — AudiencePilot" },
      { name: "description", content: "Download the AudiencePilot Chrome extension and install it in under a minute." },
      { property: "og:title", content: "Download Extension — AudiencePilot" },
      { property: "og:description", content: "Get the Manifest V3 LinkedIn automation extension with hosted AI keys." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExtensionPage,
});
