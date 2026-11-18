"use client";

import { useTranslations } from "next-intl";
import { Medal, Scroll } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type Badge = {
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earned: boolean;
  awardedAt: string | null;
  earnedBy: number;
};

type Certificate = {
  code: string;
  title: string;
  recipientName: string;
  issuedAt: string;
};

export function BadgesCatalog() {
  const t = useTranslations("badges");
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [certs, setCerts] = useState<Certificate[] | null>(null);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/badges")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Badge[]) => {
        if (alive) setBadges(data);
      })
      .catch(() => {});
    fetch("/api/certificates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Certificate[] | null) => {
        if (!alive) return;
        if (data === null) setAuthed(false);
        setCerts(data ?? []);
      })
      .catch(() => {
        if (alive) setAuthed(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">{t("subtitle")}</p>

      {badges === null ? (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[1.25rem] border p-6">
              <div className="size-10 rounded-xl bg-muted" />
              <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : badges.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {badges.map((badge) => (
            <div
              key={badge.code}
              className={
                "rounded-[1.25rem] border p-6 " +
                (badge.earned ? "border-primary/40 bg-primary/5" : "")
              }
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-xl">
                  {badge.icon}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  {badge.earned ? t("earned") : t("notEarned")}
                </span>
              </div>
              <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">
                {badge.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
              <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                {badge.points} {t("points")} · {t("earnedBy", { count: badge.earnedBy })}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-12 flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
        <Scroll className="size-5 text-primary" weight="duotone" /> {t("certificates")}
      </h2>
      {!authed ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("loginHint")}</p>
      ) : certs === null ? (
        <div className="mt-4 animate-pulse h-16 rounded-[1.25rem] border" />
      ) : certs.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("certsEmpty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-[1.25rem] border">
          {certs.map((cert) => (
            <li key={cert.code} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <Medal className="size-5 shrink-0 text-primary" weight="duotone" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{cert.title}</span>
                <span className="block font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t("code")} {cert.code} ·{" "}
                  {new Date(cert.issuedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </span>
              <a
                href={`/api/certificates/${cert.code}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/50"
              >
                {t("verify")}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
