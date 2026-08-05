import { createFileRoute } from "@tanstack/react-router";
import { PipelinePage } from "./-audience-ui";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
});
