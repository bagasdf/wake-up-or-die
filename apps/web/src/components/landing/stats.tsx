"use client";

import { useTranslations } from "next-intl";

import { useHome } from "./home-data";

export function Stats() {
  const t = useTranslations("landing.stats");
  const { data } = useHome();

  const items = [
    { label: t("articles"), value: data?.stats.articles },
    { label: t("quizzes"), value: data?.stats.quizzes },
    { label: t("badges"), value: data?.stats.badges },
    {
      label: t("contacts"),
      value: data?.emergencyContacts?.length ?? data?.stats.contacts,
    },
  ];

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-10">
      <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <dd className="font-mono text-3xl md:text-4xl tracking-tight">
              {item.value === undefined ? "…" : item.value}
            </dd>
            <dt className="mt-1 text-sm text-muted-foreground">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
