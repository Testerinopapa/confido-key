import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "../-audience-ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AudiencePilot" },
      {
        name: "description",
        content: "Your LinkedIn automation command center: outreach metrics and performance.",
      },
      { property: "og:title", content: "Dashboard — AudiencePilot" },
      {
        property: "og:description",
        content: "Track connections, comments, posts and replies in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
