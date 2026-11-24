"use client";

import { ArrowDown, Medal, Scroll, Target } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";

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
  recentCertificates: Array<{ code: string; title: string; issuedAt: string }>;
};

export function Profile() {
  const t = useTranslations("me");
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    apiJson<Me>("/api/me")
      .then((data) => {
        if (alive) {
          if (!data?.user) throw new Error("Invalid profile response");
          setMe(data);
        }
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

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
            <p className="font-heading text-lg font-semibold">
              {me.user.name ?? "Pengguna"}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {me.user.email}
            </p>
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
                      <a
                        href={`/api/certificates/${cert.code}/download`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-primary hover:border-primary"
                      >
                        <ArrowDown size={15} /> Unduh SVG
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
