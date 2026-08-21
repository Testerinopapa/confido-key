import { createFileRoute } from "@tanstack/react-router";
import { createExtensionClaimCode, hashExtensionClaimCode } from "@/lib/extension-claim";
import { getAuthenticatedUserId } from "../public/auth";

export const Route = createFileRoute("/api/extension/code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await getAuthenticatedUserId(request);
        if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const code = createExtensionClaimCode();
        const codeHash = await hashExtensionClaimCode(code);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        await supabaseAdmin
          .from("extension_claim_codes")
          .delete()
          .eq("user_id", userId)
          .is("redeemed_at", null);

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const { error } = await supabaseAdmin.from("extension_claim_codes").insert({
          user_id: userId,
          code_hash: codeHash,
          expires_at: expiresAt,
        });

        if (error) {
          console.error("[extension/code] insert error", error);
          return Response.json({ error: "Unable to generate extension code" }, { status: 500 });
        }

        return Response.json({ code, expiresAt });
      },
    },
  },
});
