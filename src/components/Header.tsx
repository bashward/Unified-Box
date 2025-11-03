"use client";

import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import ThemeToggle from "./theme/ThemeToggle";

export default function Header() {

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4">
        <Link href="/inbox" className="font-semibold tracking-tight">
          Unified Box
        </Link>

        <nav className="flex items-center gap-2">
          
          <details className="relative">
            <summary className="flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-full border border-border bg-card text-sm font-medium">
              T
            </summary>

            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
              <div className="px-2 pb-1 pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Appearance
              </div>
              <ThemeToggle/>
              <div className="my-2 h-px w-full bg-border" />

              <Link
                href="/settings"
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                Settings
              </Link>

              <button
                type="button"
                onClick={() => signOut()}
                className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
              >
                Sign out
              </button>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
