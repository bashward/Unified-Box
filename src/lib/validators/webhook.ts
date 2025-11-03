import z from "zod";

export const webhookInput = z.object({
  MessageSid: z.string(),
  From: z.string(),
  To: z.string(),
  Body: z.string().optional(),
  NumMedia: z.string().optional(),
});