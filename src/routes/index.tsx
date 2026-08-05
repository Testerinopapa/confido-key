import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "./-audience-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AudiencePilot — LinkedIn Automation Dashboard" },
      {
        name: "description",
        content:
          "AudiencePilot automates LinkedIn outreach, conversations, posts, and analytics from one polished dashboard.",
      },
      { property: "og:title", content: "AudiencePilot — LinkedIn Automation Dashboard" },
      {
        property: "og:description",
        content:
          "Automate, monitor, and scale LinkedIn outreach with smart automation and AI-powered fallbacks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
