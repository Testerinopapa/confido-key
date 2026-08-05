import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./-audience-ui";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — AudiencePilot" },
      { name: "description", content: "Choose a new password for your AudiencePilot account." },
      { property: "og:title", content: "Reset password — AudiencePilot" },
      { property: "og:description", content: "Set a new password and get back to your dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="page-shell grid place-items-center">
      <section className="panel w-full max-w-md p-9">
        <div className="auth-card mx-auto">
          <Logo />
          <h2>Set a new password</h2>
          <p>Choose a strong password you haven't used before.</p>
          <form onSubmit={onSubmit} className="contents">
            <label>
              New password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
          <div className="secure">
            <LockKeyhole className="h-5 w-5 text-blue-600" />
            This link works once and expires shortly.
          </div>
        </div>
      </section>
    </main>
  );
}
