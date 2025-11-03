import Link from "next/link";

export default function ThreadList({
  threads,
  activeId,
}: {
  threads: Array<{
    id: string;
    channel: "sms" | "whatsapp";
    unreadCount: number;
    contact: { name: string | null; phone: string };
    messages: { body: string }[];
  }>;
  activeId?: string;
}) {
  return (
    <div>
      {/* Filters row */}
      <div className="sticky top-0 z-10 bg-card/90 backdrop-blur px-3 py-2 border-b border-border">
        <div className="flex gap-2">
          <FilterChip href="/inbox?unread=1">Unread</FilterChip>
          <FilterChip href="/inbox?scheduled=1">Scheduled</FilterChip>
          <FilterChip href="/inbox?channel=sms">SMS</FilterChip>
          <FilterChip href="/inbox?channel=whatsapp">WhatsApp</FilterChip>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-border">
        {threads.map((t) => {
          const preview = t.messages[0]?.body ?? "";
          const href = `/inbox?t=${t.id}`;
          const isActive = activeId === t.id;
          return (
            <li key={t.id}>
              <Link
                className={`block px-3 py-3 ${
                  isActive ? "bg-muted/40" : "hover:bg-muted/20"
                }`}
                href={href}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {t.contact.name ?? t.contact.phone}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {t.channel}
                  </div>
                </div>
                <div className="line-clamp-1 text-sm text-muted-foreground">
                  {preview}
                </div>
                {t.unreadCount > 0 && (
                  <span className="mt-1 inline-block text-[10px] rounded-full bg-primary/15 text-primary px-2 py-0.5">
                    {t.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FilterChip({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
    >
      {children}
    </Link>
  );
}
