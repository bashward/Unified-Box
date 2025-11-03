"use client";

import { useState, useEffect } from "react"
import { useThreadRealtime } from "@/app/hooks/useThreadRealtime"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import Composer from "./Composer"

export default function ThreadView({ threadId }: { threadId?: string }) {
  const { data, isLoading } = useQuery({
    enabled: !!threadId,
    queryKey: ["thread", threadId],
    queryFn: async () => {
      const res = await fetch(`/api/threads/${threadId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  
  const [messages, setMessages] = useState<any[]>(() => (data?.thread as any)?.messages ?? [])

  useEffect(() => {
  if (data?.thread?.messages) {
    setMessages(data.thread.messages);
  }
}, [data?.thread?.messages])

  useThreadRealtime(threadId ?? "", {
  onMessage: ({ message }) => {
    setMessages((prev: any[]) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  },
})
  if (!threadId)
    return <div className="p-6 text-sm text-muted-foreground">No thread.</div>;
  if (isLoading)
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  
  const thread = data?.thread as {
    id: string
    channel: 'sms' | 'whatsapp';
    contact: { name: string | null; phone: string };
    messages: Array<{
      id: string;
      direction: "inbound" | "outbound";
      body: string;
      media?: any; // [{url:"..."}] for WA later
      createdAt: string;
    }>;
  };
  
  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur px-4 py-3">
        <div className="font-medium">
          {thread.contact.name ?? thread.contact.phone}
        </div>
      </header>

      
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((m) => {
      const isOutbound = m.direction === "outbound";
      return (
         <div
           key={m.id}
           className={`group flex ${isOutbound ? "justify-end" : "justify-start"}`}
          >
          <div
            className={[
            "max-w-[75%] wrap-break-word inline-block rounded-2xl px-3 py-2 text-sm shadow-sm",
            // give each side a slightly different shape + color
             isOutbound
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted/70 text-foreground rounded-bl-md border border-border/60",
            ].join(" ")}
          >
          {/* text */}
          {m.body && (
            <p className="whitespace-pre-wrap leading-5">{m.body}</p>
          )}

          {/* media (WhatsApp images etc.) */}
          {Array.isArray(m.media) && m.media.length > 0 && (
            <div className="mt-2 space-y-2">
              {m.media.map((x: any, i: number) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border/60"
                >
                  <Image
                    src={x.url}
                    alt="media"
                    width={480}
                    height={320}
                    className="h-auto w-full"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* subtle timestamp on hover (optional, leave for later real times) */}
          <span className="mt-1 block select-none text-[10px] leading-none text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100">
            {/* TODO: render real time; for now keep placeholder or remove */}
          </span>
        </div>
      </div>
    );
  })}
</div>


      <footer className="border-t border-border p-3">
       {/* TODO: expose a channel switcher later; for now use thread.channel */}
      <Composer threadId={thread.id} channel={thread.channel} />
      </footer>

    </div>
  );
}
