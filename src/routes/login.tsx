import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "./-audience-ui";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
