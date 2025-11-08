"use client";

import { useEffect } from "react";
import { pusherClient, threadChannel } from "@/lib/realtime/pusher";

type Handlers = {
  onMessage?: (evt: { message: any }) => void;
  onNote?: (evt: { note: any }) => void;
};

export function useThreadRealtime(
  threadId: string | undefined,
  handlers: Handlers = {},
) {
  useEffect(() => {
    if (!threadId) return;

    const channel = pusherClient.subscribe(threadChannel(threadId));

    if (handlers.onMessage) channel.bind("message.created", handlers.onMessage);
    if (handlers.onNote) channel.bind("note.created", handlers.onNote);

    return () => {
      if (handlers.onMessage)
        channel.unbind("message.created", handlers.onMessage);
      if (handlers.onNote) channel.unbind("note.created", handlers.onNote);
      pusherClient.unsubscribe(threadChannel(threadId));
    };
  }, [threadId, handlers.onMessage, handlers.onNote]);
}
