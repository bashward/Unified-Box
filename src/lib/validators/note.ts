import { z } from "zod";

export const createNoteInput = z.object({
  threadId: z.cuid(),
  body: z.string().trim().min(1).max(2000),
  visibility: z.enum(["public", "private"]).default("public"),
});
