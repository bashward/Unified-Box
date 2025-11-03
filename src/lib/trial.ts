//helpers to read trial-related env
export function getTrialNumber() {
  return process.env.TWILIO_SMS_FROM || process.env.TWILIO_WA_FROM || null;
}

export function getWhatsAppFrom() {
  return process.env.TWILIO_WA_FROM || null;
}

export function getVerifiedNumbers(): string[] {
  return (process.env.VERIFIED_NUMBERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isTrial(): boolean {
  return process.env.TWILIO_IS_TRIAL === "1" || getVerifiedNumbers().length > 0;
}
