"use client";

import { ArrowDown, Medal, Scroll, Target } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";
import {
  clearQuizRecoveryToken,
  getQuizRecoveryToken,
} from "@/lib/quiz-recovery";

type Me = {
  user: { name: string | null; email: string; createdAt: string };
  stats: {
    points: number;
    quizzesPassed: number;
    articlesRead: number;
    commentsApproved: number;
  };
  recentAttempts: Array<{
    quizTitle: string;
    score: number;
    passed: boolean;
    completedAt: string;
  }>;
  recentCertificates: Array<{
    code: string;
    title: string;
    recipientName: string;
    issuedAt: string;
  }>;
};

export function Profile() {
  const t = useTranslations("me");
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [refreshingCertificate, setRefreshingCertificate] = useState<
    string | null
  >(null);
  const [certificateMessage, setCertificateMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    const loadProfile = async () => {
      const recoveryToken = getQuizRecoveryToken();
      if (recoveryToken) {
        try {
          await apiJson("/api/me/claim-quiz-progress", {
            method: "POST",
            headers: { "x-session-key": recoveryToken },
          });
          clearQuizRecoveryToken();
        } catch {
          // Keep the token for a retry if claim fails.
        }
      }

      try {
        const data = await apiJson<Me>("/api/me");
        if (!alive) return;
        if (!data?.user) throw new Error("Invalid profile response");
        setMe(data);
        setFullName(data.user.name ?? "");
      } catch {
        if (alive) setError(true);
      }
    };

    void loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  const saveName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingName(true);
    setNameMessage(null);
    apiJson<{ name: string }>("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: fullName.trim() }),
    })
      .then((updated) => {
        setMe((current) =>
          current
            ? { ...current, user: { ...current.user, name: updated.name } }
            : current,
        );
        setFullName(updated.name);
        setEditingName(false);
        setNameMessage(
          "Nama diperbarui. Sertifikat lama dapat diperbarui dari daftar sertifikat.",
        );
      })
      .catch(() => setNameMessage("Nama gagal disimpan. Coba lagi."))
      .finally(() => setSavingName(false));
  };

  const refreshCertificateName = async (code: string) => {
    setRefreshingCertificate(code);
    setCertificateMessage(null);
    try {
      const refreshed = await apiJson<{
        code: string;
        recipientName: string;
      }>(`/api/certificates/${encodeURIComponent(code)}/refresh`, {
        method: "POST",
      });
      setMe((current) =>
        current
          ? {
              ...current,
              recentCertificates: current.recentCertificates.map(
                (certificate) =>
                  certificate.code === refreshed.code
                    ? { ...certificate, recipientName: refreshed.recipientName }
                    : certificate,
              ),
            }
          : current,
      );
      setCertificateMessage("Nama sertifikat diperbarui. Unduh ulang PDF-nya.");
    } catch {
      setCertificateMessage("Nama sertifikat gagal diperbarui. Coba lagi.");
    } finally {
      setRefreshingCertificate(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1fr_280px] md:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Area pengguna
          </p>
          <h1 className="mt-3 font-heading text-5xl font-semibold tracking-tight md:text-6xl">
            Profil & pencapaian.
          </h1>
        </div>
        {me && (
          <div className="rounded-2xl border border-border p-5">
            {editingName ? (
              <form onSubmit={saveName}>
                <label
                  className="block text-sm font-medium"
                  htmlFor="full-name"
                >
                  Nama lengkap untuk sertifikat baru
                </label>
                <input
                  id="full-name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={savingName}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {savingName ? "Menyimpan…" : "Simpan nama"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setFullName(me.user.name ?? "");
                    }}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="font-heading text-lg font-semibold">
                  {me.user.name ?? "Pengguna"}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {me.user.email}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFullName(me.user.name ?? "");
                    setNameMessage(null);
                    setEditingName(true);
                  }}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Ubah nama lengkap
                </button>
              </>
            )}
            {nameMessage ? (
              <output
                className="mt-2 block text-xs text-muted-foreground"
                aria-live="polite"
              >
                {nameMessage}
              </output>
            ) : null}
          </div>
        )}
      </header>

      {error ? (
        <p className="mt-8 text-sm text-destructive">
          {t("empty")}{" "}
          <a href="/login" className="text-primary underline">
            /login
          </a>
        </p>
      ) : null}

      {me ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [Target, t("points"), me.stats.points],
              [Medal, t("quizzesPassed"), me.stats.quizzesPassed],
              [Medal, t("articlesRead"), me.stats.articlesRead],
              [Scroll, t("commentsApproved"), me.stats.commentsApproved],
            ].map(([icon, label, value]) => {
              const Icon = icon as typeof Target;
              return (
                <div
                  key={String(label)}
                  className="rounded-[1.25rem] border p-5"
                >
                  <Icon className="size-5 text-primary" weight="duotone" />
                  <p className="mt-3 font-mono text-2xl tracking-tight">
                    {String(value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {label as string}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-[1.25rem] border p-6">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                {t("attempts")}
              </h2>
              {me.recentAttempts.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("empty")}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {me.recentAttempts.map((attempt) => (
                    <li
                      key={`${attempt.quizTitle}-${attempt.completedAt}`}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <span className="truncate">{attempt.quizTitle}</span>
                      <span className="font-mono text-xs">
                        {t("score", { score: attempt.score })} ·{" "}
                        {attempt.passed ? t("passed") : t("failed")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {certificateMessage ? (
                <output
                  className="mt-4 block text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {certificateMessage}
                </output>
              ) : null}
            </div>
            <div className="rounded-[1.25rem] border p-6">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                {t("certificates")}
              </h2>
              {me.recentCertificates.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("empty")}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {me.recentCertificates.map((cert) => (
                    <li
                      key={cert.code}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <span className="truncate">{cert.title}</span>
                      {cert.recipientName !== me.user.name ? (
                        <button
                          type="button"
                          disabled={refreshingCertificate !== null}
                          onClick={() => void refreshCertificateName(cert.code)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-primary hover:border-primary disabled:opacity-50"
                        >
                          {refreshingCertificate === cert.code
                            ? "Memperbarui…"
                            : "Perbarui nama"}
                        </button>
                      ) : null}
                      <a
                        href={`/api/certificates/${cert.code}/download`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-primary hover:border-primary"
                      >
                        <ArrowDown size={15} /> Unduh PDF
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("memberSince")}{" "}
            {new Date(me.user.createdAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}{" "}
            · {me.user.email}
          </p>
        </>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {["one", "two", "three", "four"].map((skeleton) => (
            <div
              key={skeleton}
              className="animate-pulse rounded-[1.25rem] border p-5"
            >
              <div className="size-5 rounded bg-muted" />
              <div className="mt-3 h-6 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
