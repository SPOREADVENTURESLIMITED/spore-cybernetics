/**
 * Reject browser-originated cross-site mutations. SameSite=Lax session cookies
 * remain an additional defence; this check is not a substitute for rate limits.
 */
export function hasSafeRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser clients may legitimately omit Origin.
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
