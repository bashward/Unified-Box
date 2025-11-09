"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

export default function SignIn() {
  const r = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState<"signin" | "signup" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email"));
      const password = String(fd.get("password"));
      await signIn.email({ email, password });
      r.replace("/inbox");
    } catch (err: any) {
      setError(err?.message ?? "Sign-in failed. Check your credentials.");
    } finally {
      setLoading(null);
    }
  }

  async function onSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email"));
      const password = String(fd.get("password"));
      const name = String(fd.get("name") || "") || email.split("@")[0].trim()
      const teamId = process.env.DEFAULT_TEAM_ID ?? "default-team"
      await signUp.email({ email, password, name, teamId });
      r.replace("/inbox");
    } catch (err: any) {
      setError(err?.message ?? "Sign-up failed. Try a different email.");
    } finally {
      setLoading(null);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-input/60 px-3 py-2 outline-none " +
    "placeholder:text-muted-foreground focus:ring-2 ring-primary";

  const btnPrimary =
    "w-full rounded-2xl bg-primary text-primary-foreground px-3 py-2 hover:opacity-95 transition";

  const btnGhost =
    "w-full rounded-2xl border border-border bg-card/60 px-3 py-2 hover:bg-card transition";

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-linear-to-b from-background to-muted/40">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur shadow-soft">
          {/* Brand / header */}
          <div className="px-6 pt-6 text-center">
            <h1 className="text-2xl font-semibold">Unified Box</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, sign in or create an account
            </p>
          </div>

          {/* Tabs */}
          <div className="px-6 mt-4">
            <div
              role="tablist"
              aria-label="Auth Tabs"
              className="grid grid-cols-2 rounded-xl border border-border bg-input/40 p-1"
            >
              <button
                role="tab"
                aria-selected={tab === "signin"}
                onClick={() => setTab("signin")}
                className={`rounded-lg py-2 text-sm transition ${
                  tab === "signin"
                    ? "bg-card shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                role="tab"
                aria-selected={tab === "signup"}
                onClick={() => setTab("signup")}
                className={`rounded-lg py-2 text-sm transition ${
                  tab === "signup"
                    ? "bg-card shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create account
              </button>
            </div>
          </div>

          {/* Panels */}
          <div className="px-6 pb-6 pt-4">
            {tab === "signin" ? (
              <form
                onSubmit={onSignIn}
                className="space-y-3"
                aria-label="Sign in form"
              >
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className={inputClass}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                  required
                />
                {error && (
                  <div className="mx-6 mb-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button className={btnPrimary} disabled={loading === "signin"}>
                  {loading === "signin" ? "Signing in…" : "Sign in"}
                </button>
                <button
                  className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 hover:bg-card transition"
                  onClick={() =>
                    authClient.signIn.social({ provider: "google" })
                  }
                >
                  Continue with Google
                </button>
              </form>
            ) : (
              <form
                onSubmit={onSignUp}
                className="space-y-3"
                aria-label="Sign up form"
              >
                <input
                  name="name"
                  type="text"
                  placeholder="Name"
                  className={inputClass}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className={inputClass}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                  required
                />
                {error && (
                  <div className="mx-6 mb-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button className={btnGhost} disabled={loading === "signup"}>
                  {loading === "signup" ? "Creating…" : "Create account"}
                </button>
                <button
                  className="w-full rounded-2xl border border-border bg-card/60 px-3 py-2 hover:bg-card transition"
                  onClick={() =>
                    authClient.signIn.social({ provider: "google" })
                  }
                >
                  Continue with Google
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms & Privacy.
        </p>
      </div>
    </main>
  );
}
