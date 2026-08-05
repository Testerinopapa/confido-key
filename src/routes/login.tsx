import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo, Button } from "./-audience-ui";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AudiencePilot" },
      {
        name: "description",
        content: "Sign in to AudiencePilot to manage your LinkedIn automation and lead pipeline.",
      },
      { property: "og:title", content: "Sign in — AudiencePilot" },
      {
        property: "og:description",
        content: "Access your outreach dashboard, pipeline and analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/dashboard", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) setCheckEmail(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  async function onReset() {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent");
  }

  return (
    <main className="page-shell grid place-items-center">
      <section className="panel w-full max-w-md bg-[radial-gradient(#dce7ff_1px,transparent_1px)] [background-size:16px_16px] p-9">
        <div className="auth-card mx-auto">
          <Logo />
          {checkEmail ? (
            <>
              <h2>Check your email 📬</h2>
              <p>
                We sent a confirmation link to <b>{email}</b>. Click it to activate your account,
                then come back and sign in.
              </p>
              <button className="btn soft" type="button" onClick={() => setCheckEmail(false)}>
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <h2>{mode === "signin" ? "Welcome back 👋" : "Create your account"}</h2>
              <p>
                {mode === "signin"
                  ? "Sign in to continue to your dashboard"
                  : "Start automating your outreach in minutes"}
              </p>
              <form onSubmit={onSubmit} className="contents">
                {mode === "signup" && (
                  <label>
                    Full name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sarah Johnson"
                      autoComplete="name"
                    />
                  </label>
                )}
                <label>
                  Email address
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </label>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                    className="font-semibold text-blue-600"
                  >
                    {mode === "signin" ? "Create an account" : "I already have an account"}
                  </button>
                  {mode === "signin" && (
                    <button type="button" onClick={onReset} className="text-slate-500 underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <button className="btn primary" type="submit" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>
              <div className="divider">or continue with</div>
              <button className="oauth" type="button" onClick={onGoogle} disabled={busy}>
                <Globe2 className="h-4 w-4" />
                Continue with Google
              </button>
            </>
          )}
          <div className="secure">
            <LockKeyhole className="h-5 w-5 text-blue-600" />
            Your data is encrypted and secure.
            <br />
            We never store your LinkedIn password.
          </div>
          <Link to="/" className="text-center text-xs text-slate-500 underline">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
