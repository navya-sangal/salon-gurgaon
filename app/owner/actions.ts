"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { setBookingStatus } from "@/lib/bookings";
import { endSession, getSession, isOwnerLoginConfigured, roleForPassword, startSession } from "@/lib/owner-session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isOwnerLoginConfigured()) {
    return { error: "Owner login isn't set up on this server yet (OWNER_SESSION_SECRET is missing)." };
  }
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const role = roleForPassword(password);
  if (!role) {
    // Slow down password guessing a little.
    await new Promise((r) => setTimeout(r, 700));
    return { error: "That password isn't right." };
  }
  await startSession(role);
  redirect("/owner");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/owner");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateStatus(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/owner");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!UUID.test(id) || (status !== "confirmed" && status !== "cancelled")) return;

  const result = await setBookingStatus(id, status);
  if (!result.ok) console.error(`Could not set booking ${id} to ${status}: ${result.reason}`);
  refresh();
}
