"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

export function LoginForms({ demoPassword }: { demoPassword: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form action={action} className="border-line bg-paper rounded-3xl border p-6 sm:p-8">
        <h2 className="font-display text-ink text-3xl font-medium">Try the demo</h2>
        <p className="text-slate mt-2 text-sm leading-relaxed">
          This dashboard is part of the concept build. Use the demo password to look around. You can confirm and
          cancel bookings; sample bookings reset every morning.
        </p>
        <p className="bg-lilac-soft text-ink mt-5 rounded-xl px-4 py-3 text-sm">
          Demo password: <code className="font-semibold">{demoPassword}</code>
        </p>
        <input type="hidden" name="password" value={demoPassword} />
        <button
          type="submit"
          disabled={pending}
          className="bg-sage hover:bg-sage-dark mt-5 w-full rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-70"
        >
          {pending ? "Opening…" : "Open the demo dashboard"}
        </button>
      </form>

      <form action={action} className="border-line rounded-3xl border p-6 sm:p-8">
        <h2 className="font-display text-ink text-3xl font-medium">Owner login</h2>
        <p className="text-slate mt-2 text-sm leading-relaxed">For the salon owner. Shows full customer details.</p>
        <label htmlFor="owner-password" className="text-ink mt-5 mb-2 block text-sm font-semibold">
          Password
        </label>
        <input
          id="owner-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border-line text-ink focus:border-sage w-full rounded-xl border bg-white px-4 py-3 text-base outline-none"
          aria-describedby={state.error ? "login-error" : undefined}
        />
        {state.error && (
          <p id="login-error" role="alert" className="mt-3 text-sm text-red-800">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-mist hover:bg-ink-2 mt-5 w-full rounded-full px-6 py-3.5 text-sm font-semibold transition-colors disabled:opacity-70"
        >
          Log in
        </button>
      </form>
    </div>
  );
}

export function SubmitButton({ children, className }: { children: ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? "Saving…" : children}
    </button>
  );
}
