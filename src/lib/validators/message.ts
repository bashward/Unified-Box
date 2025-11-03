import { z } from "zod";

export const sendMessageInput = z.object({
  contactId: z.cuid().optional(),
  threadId: z.cuid().optional(),
  channel: z.enum(["sms", "whatsapp"]),
  body: z.string().min(1).max(2000),
  media: z.array(z.object({ url: z.url() })).optional(), 
  scheduleAt: z.iso.datetime().optional(),
}).refine(v => !!v.contactId || !!v.threadId, {
  message: "Provide contactId or threadId"
});

export type SendMessageInput = z.infer<typeof sendMessageInput>;
