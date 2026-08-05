import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "./-audience-ui";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
