import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createExtensionClaimCode, hashExtensionClaimCode } from "@/lib/extension-claim";

export const Route = createFileRoute("/api/extension/code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("Authorization") ?? "";
        if (!authorization.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) {
          console.error("[extension/code] missing Supabase server env");
          return Response.json({ error: "Server not configured" }, { status: 500 });
        }

        // Acts as the signed-in user (RLS applies); no service-role key needed.
        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              headers.set("apikey", key);
              headers.set("Authorization", authorization);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data: userData, error: userError } = await supabase.auth.getUser(
          authorization.slice("Bearer ".length).trim(),
        );
        const userId = userError ? null : userData.user?.id ?? null;
        if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const code = createExtensionClaimCode();
        const codeHash = await hashExtensionClaimCode(code);

        await supabase
          .from("extension_claim_codes")
          .delete()
          .eq("user_id", userId)
          .is("redeemed_at", null);

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const { error } = await supabase.from("extension_claim_codes").insert({
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
