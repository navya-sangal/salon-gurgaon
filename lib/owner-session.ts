import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// A tiny signed-cookie session for /owner. Two roles:
//  - "owner": logged in with OWNER_PASSWORD (yours, secret). Sees everything.
//  - "demo":  logged in with the public demo password shown on the login page.
//             Can confirm/cancel, but real visitors' names and phone numbers are masked.

export type OwnerRole = "owner" | "demo";

/** Shown on the login page on purpose, so clients can try the dashboard. */
export const DEMO_PASSWORD = "demo-saanjh";

const COOKIE = "saanjh_owner";
const MAX_AGE_SECONDS = 8 * 60 * 60;

function secret(): string | null {
  const s = process.env.OWNER_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** Constant-time string comparison (hashing first makes both sides the same length). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Which role (if any) a submitted password unlocks. */
export function roleForPassword(password: string): OwnerRole | null {
  const real = process.env.OWNER_PASSWORD;
  if (real && real.length >= 8 && safeEqual(password, real)) return "owner";
  if (safeEqual(password, DEMO_PASSWORD)) return "demo";
  return null;
}

export function isOwnerLoginConfigured(): boolean {
  return secret() !== null;
}

export async function startSession(role: OwnerRole): Promise<void> {
  const key = secret();
  if (!key) throw new Error("OWNER_SESSION_SECRET is missing or shorter than 32 characters.");
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${role}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<{ role: OwnerRole } | null> {
  const key = secret();
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!key || !raw) return null;
  const [role, exp, sig] = raw.split(".");
  if ((role !== "owner" && role !== "demo") || !exp || !sig) return null;
  if (!safeEqual(sig, sign(`${role}.${exp}`, key))) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  return { role };
}
