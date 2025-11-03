import twilio from "twilio"

const sid = process.env.TWILIO_ACCOUNT_SID!
const token = process.env.TWILIO_AUTH_TOKEN!
const smsFrom = process.env.TWILIO_SMS_FROM!
const waFrom = process.env.TWILIO_WA_FROM!
const client = twilio(sid, token)

//only allow verified numbers
const verifiedSet = new Set(
  (process.env.VERIFIED_NUMBERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

function ensureTrialAllowed(to: string) {
  if (verifiedSet.size === 0) return; 
  if (!verifiedSet.has(to.replace(/^whatsapp:/, ""))) {
    const hint = Array.from(verifiedSet).join(", ")
    throw new Error(
      `Twilio trial guard: "${to}" is not in VERIFIED_NUMBERS. Allowed: ${hint}`
    );
  }
}

export async function sendSMS(to: string, body: string) {
  ensureTrialAllowed(to);
  const msg = await client.messages.create({ to, from: smsFrom, body })
  return { sid: msg.sid, status: msg.status }
}

export async function sendWhatsApp(to: string, body: string, media?: { url: string }[]) {
  const toAddr = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`
  ensureTrialAllowed(toAddr)
  const mediaUrls = media?.map((m) => m.url)
  const msg = await client.messages.create({
    to: toAddr,
    from: waFrom.startsWith("whatsapp:") ? waFrom : `whatsapp:${waFrom}`,
    body,
    ...(mediaUrls && mediaUrls.length ? { mediaUrl: mediaUrls } : {}),
  });
 
  return { sid: msg.sid, status: msg.status }
}

export function validateTwilioRequest(url: string, signature: string, params: Record<string, any>) {
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return twilio.validateRequest(token, signature, url, params);
}