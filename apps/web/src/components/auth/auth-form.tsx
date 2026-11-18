"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    const path = mode === "login" ? "sign-in/email" : "sign-up/email";
    const body: Record<string, string> = { email, password };
    if (mode === "register") body.name = name;
    fetch(`/api/auth/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(() => {
        window.location.href = "/me";
      })
      .catch(() => setError(t("error")))
      .finally(() => setSending(false));
  };

  const inputClass =
    "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {mode === "login" ? t("loginTitle") : t("registerTitle")}
      </h1>
      <form onSubmit={submit} className="mt-8 max-w-sm space-y-3">
        {mode === "register" ? (
          <label className="block">
            <span className="text-sm font-medium">{t("name")}</span>
            <input
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium">{t("email")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("password")}</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
        >
          {mode === "login" ? t("submitLogin") : t("submitRegister")}
        </button>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            {t("switchToRegister")}{" "}
            <Link href="/register" className="text-primary underline">
              {t("registerTitle")}
            </Link>
          </>
        ) : (
          <>
            {t("switchToLogin")}{" "}
            <Link href="/login" className="text-primary underline">
              {t("loginTitle")}
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
