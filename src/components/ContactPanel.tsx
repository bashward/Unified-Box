"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useThreadRealtime } from "@/app/hooks/useThreadRealtime"
import { useState } from "react"; 

export default function ContactPanel({ threadId }: { threadId?: string }) {

   const qc = useQueryClient()
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")


  const { data } = useQuery({
    enabled: !!threadId,
    queryKey: ["threadSidebar", threadId],
    queryFn: async () => {
      const res = await fetch(`/api/threads/${threadId}/sidebar`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!threadId) return null;

  const contact = data?.contact as
    | { name: string | null; phone: string }
    | undefined;
  const notes =
    (data?.notes as Array<{
      id: string;
      body: string;
      visibility: "public" | "private";
      createdAt: string;
    }>) ?? [];


   const createNote = useMutation({
    mutationKey: ["create-note", threadId],
    mutationFn: async (vars: { body: string; visibility: "public" | "private" }) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId, ...vars }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return (await res.json()).note as any;
    },
    onMutate: async (vars) => {
      //optimistic add into sidebar cache
      await qc.cancelQueries({ queryKey: ["threadSidebar", threadId] });
      const prev = qc.getQueryData<any>(["threadSidebar", threadId]);
      const optimistic = {
        id: "tmp_" + Date.now(),
        body: vars.body,
        visibility: vars.visibility,
        createdAt: new Date().toISOString(),
        author: { name: "You", email: "" },
      };
      qc.setQueryData(["threadSidebar", threadId], (old: any) =>
        old ? { ...old, notes: [optimistic, ...(old.notes ?? [])] } : old
      );
      setBody("");
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["threadSidebar", threadId], ctx.prev);
    },
    onSuccess: (note) => {
      // swap optimistic with real
      qc.setQueryData(["threadSidebar", threadId], (old: any) => {
      if (!old) return old;
      const exists = old.notes?.some((n: any) => n.id === note.id);
      if (exists) return old;
      return { ...old, notes: [note, ...(old.notes ?? [])] };
      });
    },
  })

  useThreadRealtime(threadId, {
  onNote: ({ note }) => {
    qc.setQueryData(["threadSidebar", threadId], (old: any) => {
      if (!old) return old;
      const notes = old.notes ?? [];
      if (notes.some((n: any) => n.id === note.id)) return old;
      return { ...old, notes: [note, ...notes] };
    })
    qc.invalidateQueries({ queryKey: ["threadSidebar", threadId] })
  },
})

const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  e.target.style.height = "0px";
  e.target.style.height = e.target.scrollHeight + "px";
};


  return (
     <aside className="flex h-full flex-col">
    {/* Contact header */}
    <div className="border-b border-border p-4">
      <div className="text-lg font-semibold">{contact?.name ?? "Contact"}</div>
      <div className="text-sm text-muted-foreground">{contact?.phone}</div>
    </div>

    {/* Notes list */}
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-3 text-xs font-medium text-muted-foreground">Notes</div>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No notes yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {/* author name if included in payload; else fallback */}
                  {("author" in n && (n as any).author?.name) || "Admin"}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {n.visibility}
                </span>
              </div>
              <div className="text-sm whitespace-pre-wrap">{n.body}</div>
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* Add note form */}
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const b = body.trim()
        if (!b) return
        createNote.mutate({ body: b, visibility });
      }}
      className="border-t border-border p-4 space-y-3"
    >
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
        }}
        onInput={autoResize}
        placeholder="Add a note…"
        className="w-full min-h-11 resize-none rounded-xl border border-border bg-input/60 px-3 py-2 leading-6"
      />

      <div className="flex items-center justify-between gap-2">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as any)}
          className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <button
          type="submit"
          className="rounded-xl bg-primary px-3 py-1.5 text-primary-foreground hover:cursor-pointer"
        >
          Add note
        </button>
      </div>
    </form>
  </aside>
  );
}

