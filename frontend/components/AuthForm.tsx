"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

type Mode = "signin" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const tooShort = isRegister && password.length > 0 && password.length < 8;
  const mismatch = isRegister && confirm.length > 0 && confirm !== password;
  const canSubmit = isRegister
    ? fullName && email && phone && password.length >= 8 && confirm === password
    : email && password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const response = await apiFetch<AuthUser>(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(
          isRegister ? { fullName, email, phone, password } : { email, password }
        ),
      });
      auth.login(response);
      router.push(searchParams.get("redirect") ?? "/products");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.error.message);
        setFieldErrors(err.error.fields ?? {});
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[420px] px-5 py-16">
      <h1 className="font-serif text-[38px]">{isRegister ? "Create account" : "Sign in"}</h1>
      <p className="mb-10 text-sm text-grey">
        {isRegister ? "You need an account to hold a piece. Browsing stays open." : "Welcome back."}
      </p>

      {formError && (
        <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{formError}</div>
      )}

      <form onSubmit={onSubmit}>
        {isRegister && (
          <Field label="Full name" fieldError={fieldErrors.fullName}>
            <input
              className="field-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Kofi Mensah"
            />
          </Field>
        )}
        <Field label="Email" fieldError={fieldErrors.email}>
          <input
            className="field-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        {isRegister && (
          <Field label="Phone number" fieldError={fieldErrors.phone}>
            <input
              className="field-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233"
            />
          </Field>
        )}
        <Field
          label="Password"
          fieldError={fieldErrors.password ?? (tooShort ? "At least 8 characters" : undefined)}
        >
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? "At least 8 characters" : undefined}
          />
        </Field>
        {isRegister && password.length > 0 && (
          <Field
            label="Confirm password"
            fieldError={mismatch ? "Passwords do not match" : undefined}
            note={!mismatch && confirm.length > 0 ? "Passwords match" : undefined}
          >
            <input
              className="field-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
            />
          </Field>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="mt-3.5 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:cursor-not-allowed disabled:bg-disabled"
        >
          {isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <Link
        href={isRegister ? "/login" : "/register"}
        className="mt-6 block w-full text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink"
      >
        {isRegister ? "Have an account? Sign in" : "New here? Create an account"}
      </Link>
    </div>
  );
}

function Field({
  label,
  fieldError,
  note,
  children,
}: {
  label: string;
  fieldError?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{label}</label>
      {children}
      {fieldError && <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{fieldError}</div>}
      {!fieldError && note && <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink">{note}</div>}
    </div>
  );
}
