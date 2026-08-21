import { createServerFn } from "@tanstack/react-start";

const EXTENSION_FILE = "/audiencepilot-extension.zip";

export const getExtensionDownloadUrl = createServerFn({ method: "GET" })
  .handler(async () => {
    return { url: EXTENSION_FILE, filename: "audiencepilot-extension.zip" };
  });
