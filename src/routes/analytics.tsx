import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "./-audience-ui";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});
