import { createFileRoute } from "@tanstack/react-router";
import { PipelinePage } from "../-audience-ui";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — AudiencePilot" },
      {
        name: "description",
        content: "Track every lead and conversation across your outreach journey.",
      },
      { property: "og:title", content: "Pipeline — AudiencePilot" },
      {
        property: "og:description",
        content: "Kanban lead tracking from first connection to follow-up.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PipelinePage,
});
