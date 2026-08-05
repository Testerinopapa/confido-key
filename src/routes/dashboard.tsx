import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "./-audience-ui";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
