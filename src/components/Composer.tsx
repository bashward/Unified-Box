"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  threadId?: string;
  contactId?: string;
  channel: "sms" | "whatsapp";
};

export default function Composer({ threadId, contactId, channel }: Props) {
  const [scheduleAt, setScheduleAt] = useState<string>("")
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/send", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          threadId,
          contactId,
          channel,
          body: text,
          media: channel === "whatsapp" && mediaUrl ? [{ url: mediaUrl }] : undefined,
          scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Send failed");
      return data.message;
    },
    onMutate:  () => {
      //optimistic append to thread messages
      if (!threadId) return;
       qc.cancelQueries({ queryKey: ["thread", threadId] });
      const prev = qc.getQueryData<any>(["thread", threadId]);
      const optimistic = {
        id: "optimistic-" + Math.random().toString(36).slice(2),
        threadId,
        authorId: null,
        channel,
        direction: "outbound",
        body: text,
        media: channel === "whatsapp" && mediaUrl ? [{ url: mediaUrl }] : null,
        status: scheduleAt ? "scheduled" : "sent",
        createdAt: new Date().toISOString(),
      };
      
      qc.setQueryData(["thread", threadId], (old: any) => {
       try {
         if (!old) return old;

    // Case A: cache stores the direct thread object
       if (Array.isArray(old.messages)) {
      return { ...old, messages: [...old.messages, optimistic] };
      }

    // Case B: cache stores { thread: { ... } }
      if (old.thread?.messages && Array.isArray(old.thread.messages)) {
      return {
        ...old,
        thread: {
          ...old.thread,
          messages: [...old.thread.messages, optimistic],
        },
      };
      }

      // Fallback: leave untouched
      return old
  } catch (e) {
    console.error("[Composer] onMutate cache error", e, old)
    return old
  }
});

      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (!threadId) return;
      if (ctx?.prev) qc.setQueryData(["thread", threadId], ctx.prev);
    },
    onSuccess: (saved) => {
    if (threadId) qc.invalidateQueries({ queryKey: ["thread", threadId] })
    setText("")
    setMediaUrl("")    
    },
  });

  return (
     <form
    className="flex items-center gap-2"
    onSubmit={ (e) => {
      e.preventDefault();
      if (!text.trim() || isPending) return;
      mutate();
    }}
  >
    <input
      className="flex-1 rounded-xl border border-border bg-input/60 px-3 py-2"
      placeholder="Type a message…"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
    {channel === "whatsapp" && (
      <input
        className="w-64 rounded-xl border border-border bg-input/60 px-3 py-2"
        placeholder="Media URL (optional)"
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
      />
    )}
    <input
     type="datetime-local"
     value={scheduleAt}
     onChange={(e) => setScheduleAt(e.target.value)}
     className="rounded-xl border border-border bg-input/60 px-2 py-1 text-sm"
    />
    <button
     type="button"
     onClick={() => {
    if (!text.trim() || !scheduleAt || isPending) return;
    console.log("[Composer] submit scheduled");
    mutate(); // reads scheduleAt from state
    }}
    className="rounded-xl border border-border px-3 py-2 text-sm hover:cursor-pointer"
    disabled={!text.trim() || !scheduleAt || isPending}
    >
    Send later
    </button>
    <button
      type="submit"
      className="rounded-xl bg-primary px-3 py-2 text-primary-foreground hover:cursor-pointer"
      disabled={!text.trim() || isPending}
      aria-busy={isPending}
    >
      {isPending ? "Sending…" : "Send"}
    </button>
  </form>
  );
}
