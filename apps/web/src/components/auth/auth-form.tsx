"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/lib/i18n";

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
    "mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

  return (
    <section className="mx-auto grid min-h-[720px] w-full max-w-[1280px] items-center px-5 pb-20 pt-32 md:px-8 md:pt-36 lg:grid-cols-2">
      <div className="hidden min-h-[520px] flex-col justify-between rounded-[28px] bg-primary p-10 text-primary-foreground lg:flex">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            WAKE UP OR DIE
          </p>
          <h1 className="mt-5 max-w-[12ch] font-heading text-6xl font-semibold leading-[0.95] tracking-tight">
            Bangun pengetahuanmu.
          </h1>
        </div>
        <p className="max-w-[36ch] text-sm leading-7 opacity-80">
          Simpan progres kuis, lencana, dan sertifikat dalam satu akun.
        </p>
      </div>
      <div className="mx-auto w-full max-w-[420px] rounded-[28px] border border-border bg-card p-6 md:p-9">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
          {mode === "login" ? "Selamat datang kembali" : "Buat akun"}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
          {mode === "login" ? t("loginTitle") : t("registerTitle")}
        </h1>
        <form onSubmit={submit} className="mt-7 space-y-4">
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
      </div>
    </section>
  );
}
