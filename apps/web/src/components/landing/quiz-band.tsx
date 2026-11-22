"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

export function QuizBand() {
  const t = useTranslations("landing.quiz");

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border bg-primary p-8 text-primary-foreground md:p-12">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-[40ch]">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm opacity-90">{t("body")}</p>
        </div>
        <Link
          href="/quiz"
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-background px-4 text-sm font-medium text-foreground transition-transform hover:-translate-y-px"
        >
          {t("cta")}
          <ArrowRight weight="bold" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
