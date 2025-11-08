"use client";

import { useEffect, useState } from "react";

type Summary = {
  byChannel: { sms: number; whatsapp: number };
  avg: { avgMs: number; avgMinutes: number } | null;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <a
          href="/api/analytics/export.csv"
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
        >
          Export CSV
        </a>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Messages (7d)
            </div>
            <div className="text-2xl font-semibold">
              {(data?.byChannel.sms ?? 0) + (data?.byChannel.whatsapp ?? 0)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-border/60 bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">SMS</div>
                <div className="font-medium">{data?.byChannel.sms ?? 0}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">WhatsApp</div>
                <div className="font-medium">
                  {data?.byChannel.whatsapp ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Avg First Response (24h)
            </div>
            <div className="text-2xl font-semibold">
              {data?.avg?.avgMinutes != null
                ? `${data.avg.avgMinutes} min`
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data?.avg?.avgMs != null
                ? `${data.avg.avgMs} ms`
                : "No pairs found"}
            </div>
          </div>

          {/* Placeholder for future chart or tile */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Notes (24h)
            </div>
            <div className="text-2xl font-semibold">—</div>
          </div>
        </div>
      )}
    </main>
  );
}
