"use client";

import { useTranslations } from "next-intl";
import { Medal, Scroll, Target } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type Me = {
  user: { name: string | null; email: string; createdAt: string };
  stats: { points: number; quizzesPassed: number; articlesRead: number; commentsApproved: number };
  recentAttempts: Array<{ quizTitle: string; score: number; passed: boolean; completedAt: string }>;
  recentCertificates: Array<{ code: string; title: string; issuedAt: string }>;
};

export function Profile() {
  const t = useTranslations("me");
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Me) => {
        if (alive) setMe(data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">{t("subtitle")}</p>

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
            ].map(([icon, label, value], i) => {
              const Icon = icon as typeof Target;
              return (
                <div key={i} className="rounded-[1.25rem] border p-5">
                  <Icon className="size-5 text-primary" weight="duotone" />
                  <p className="mt-3 font-mono text-2xl tracking-tight">{String(value)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label as string}</p>
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
                <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {me.recentAttempts.map((attempt, i) => (
                    <li key={i} className="flex items-center justify-between py-3 text-sm">
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
                <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {me.recentCertificates.map((cert) => (
                    <li key={cert.code} className="flex items-center justify-between py-3 text-sm">
                      <span className="truncate">{cert.title}</span>
                      <span className="font-mono text-xs">{cert.code}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("memberSince")}{" "}
            {new Date(me.user.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })} ·{" "}
            {me.user.email}
          </p>
        </>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[1.25rem] border p-5">
              <div className="size-5 rounded bg-muted" />
              <div className="mt-3 h-6 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
