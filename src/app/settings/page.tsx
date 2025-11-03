import { requireRole } from "../../lib/auth/guards";

import { isTrial, getTrialNumber, getVerifiedNumbers, getWhatsAppFrom } from "@/lib/trial";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  //await requireRole("admin")
  const trial = isTrial()
  const smsFrom = getTrialNumber()
  const waFrom = getWhatsAppFrom()
  const verified = getVerifiedNumbers()

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        {trial && (
          <span className="rounded-full border border-border bg-amber-100/10 px-3 py-1 text-xs text-amber-600 dark:text-amber-400">
            Trial mode
          </span>
        )}
      </header>

      {trial && (
        <div className="rounded-2xl border border-amber-200/40 bg-amber-50/50 p-4 text-sm dark:border-amber-400/20 dark:bg-amber-900/10">
          In Twilio <b>trial mode</b>, you can only message <b>verified recipient numbers</b>.
          Add your phone(s) in <a href="https://www.twilio.com/console/phone-numbers/verified" target="_blank" className="underline">Twilio Console → Verified</a>, then include them in <code className="rounded bg-muted px-1">VERIFIED_NUMBERS</code>.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">SMS From</div>
          <div className="text-lg font-medium">{smsFrom ?? "—"}</div>
          <div className="mt-3 flex gap-2">
            <a
              href="https://www.twilio.com/console/phone-numbers/search"
              target="_blank"
              className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm hover:bg-accent"
            >
              Buy Number
            </a>
            <a
              href="https://www.twilio.com/console/phone-numbers/verified"
              target="_blank"
              className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm hover:bg-accent"
            >
              Manage Verified
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">WhatsApp Sender</div>
          <div className="text-lg font-medium">
            {waFrom ?? "—"}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            For sandbox, use the Twilio WA sandbox number and join code.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 text-sm font-medium">Verified recipient numbers</div>
        {verified.length ? (
          <ul className="space-y-1 text-sm">
            {verified.map((v) => (
              <li
                key={v}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
              >
                <span className="font-mono">{v}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">None configured.</div>
        )}
        <div className="mt-3 text-xs text-muted-foreground">
          Set via <code className="rounded bg-muted px-1">VERIFIED_NUMBERS</code>.
        </div>
      </section>
    </main>
  );
}

