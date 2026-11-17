/**
 * SPORE SMS shared gateway client.
 * Configure SPORE_SMS_API_KEY as a Cloudflare Worker secret per application.
 * Never expose the key to browser code or commit it to the repository.
 */
const DEFAULT_BASE_URL = "https://spore-sms-gateway.spore-cybernetics.workers.dev";

export async function sendSporeSms(env, { to, message, senderId, idempotencyKey } = {}) {
  if (!env?.SPORE_SMS_API_KEY) return { ok: false, skipped: true, reason: "SPORE_SMS_API_KEY is not configured" };
  if (!/^\+[1-9][0-9]{7,14}$/.test(String(to || ""))) throw new Error("Recipient must be an E.164 phone number");
  if (typeof message !== "string" || !message.trim() || message.length > 1000) throw new Error("SMS message must contain 1–1000 characters");
  const base = String(env.SPORE_SMS_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const headers = { authorization: `Bearer ${env.SPORE_SMS_API_KEY}`, "content-type": "application/json" };
  if (idempotencyKey) headers["idempotency-key"] = String(idempotencyKey).slice(0, 128);
  const response = await fetch(`${base}/v1/messages`, { method: "POST", headers, body: JSON.stringify({ to: String(to), message: message.trim(), ...(senderId ? { sender_id: String(senderId) } : {}) }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`SPORE SMS rejected request (${response.status}): ${result.error || "gateway_error"}`);
  return { ok: true, ...result };
}
