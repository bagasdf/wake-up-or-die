"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "@/lib/i18n";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setSending(true);
    setError(null);
    const requestedReturnTo = new URLSearchParams(window.location.search).get(
      "returnTo",
    );
    const origin = window.location.origin;
    let callbackURL = new URL("/me", origin);
    if (requestedReturnTo) {
      try {
        const candidate = new URL(requestedReturnTo, origin);
        if (candidate.origin === origin) callbackURL = candidate;
      } catch {
        // Keep the safe dashboard callback for malformed return paths.
      }
    }

    try {
      const response = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          callbackURL: callbackURL.toString(),
          errorCallbackURL: new URL("/login?error=google", origin).toString(),
          disableRedirect: true,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        url?: string;
      } | null;

      if (!response.ok || !result?.url) {
        throw new Error("Google sign-in unavailable");
      }

      window.location.assign(result.url);
    } catch {
      setError(
        "Google Sign-In belum tersedia. Pastikan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET sudah dikonfigurasi.",
      );
      setSending(false);
    }
  };

  return (
    <section className="auth-layout mx-auto grid min-h-[720px] w-full max-w-[1280px] items-center px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <div className="auth-aside min-h-[520px] flex-col justify-between rounded-[28px] bg-primary p-10 text-primary-foreground">
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
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {mode === "login"
            ? "Masuk dengan Google. Akun baru dibuat otomatis saat pertama kali masuk."
            : "Gunakan akun Google untuk membuat akun Wake Up or Die."}
        </p>
        <div className="mt-7">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={sending}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-full bg-white font-bold text-[#4285f4]"
            >
              G
            </span>
            {sending ? "Menghubungkan ke Google…" : "Lanjutkan dengan Google"}
          </button>
          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              {t("switchToRegister")}{" "}
              <Link href="/register" className="text-primary underline">
                Buat akun
              </Link>
            </>
          ) : (
            <>
              {t("switchToLogin")}{" "}
              <Link href="/login" className="text-primary underline">
                Masuk dengan Google
              </Link>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
