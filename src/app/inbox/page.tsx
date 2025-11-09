import { requireSession } from "@/lib/auth/guards";
import { getThreads } from "@/lib/inbox";
import ThreadList from "@/components/ThreadList";
import ThreadView from "@/components/ThreadView";
import ContactPanel from "@/components/ContactPanel";
import { Suspense } from "react";

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{
    unread?: "1";
    scheduled?: "1";
    channel?: "sms" | "whatsapp";
    q?: string;
    t?: string; // threadId
  }>;
}) {
  const session = await requireSession()
  const sp = await searchParams

  const threads = await getThreads({
    teamId: session.teamId,
    unread: sp?.unread === "1",
    scheduled: sp?.scheduled === "1",
    channel: sp?.channel,
    search: sp?.q,
  });

  const activeThreadId = sp?.t ?? threads[0]?.id;

  return (
    <main className="grid h-[calc(100vh-64px)] grid-cols-[320px_minmax(0,1fr)_360px] gap-px border border-border bg-border">
      <section className="bg-card overflow-y-auto">
        <ThreadList threads={threads} activeId={activeThreadId} />
      </section>

      <section className="bg-card overflow-y-auto">
        <Suspense
          fallback={
            <div className="p-6 text-sm text-muted-foreground">
              Loading thread…
            </div>
          }
        >
          {/* Client detail component handles realtime + optimistic */}
          <ThreadView threadId={activeThreadId} />
        </Suspense>
      </section>

      <aside className="bg-card overflow-y-auto">
        <ContactPanel threadId={activeThreadId} />
      </aside>
    </main>
  );
}
