import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "../-audience-ui";

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
  component: AnalyticsPage,
});
