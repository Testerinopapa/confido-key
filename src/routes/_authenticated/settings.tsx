import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../-audience-ui";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AudiencePilot" },
      {
        name: "description",
        content: "Configure automation behavior, daily limits, content and scheduling.",
      },
      { property: "og:title", content: "Settings — AudiencePilot" },
      {
        property: "og:description",
        content: "Tune limits, speed presets and campaign content safely.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});
