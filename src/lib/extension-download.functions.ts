import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "linkedinextension";
const OBJECT_PATH = "LinkedInExtension.rar";

export const getExtensionDownloadUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(OBJECT_PATH, 300, { download: OBJECT_PATH });

    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? "Could not create download link");
    }

    return { url: data.signedUrl, filename: OBJECT_PATH };
  });
