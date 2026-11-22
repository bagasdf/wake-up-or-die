"use client";

import { PhoneCall } from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

import { useHome } from "./home-data";

export function Helpline() {
  const t = useTranslations("landing.help");
  const { data } = useHome();
  const contacts = data?.emergencyContacts ?? [];

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-[45ch] text-sm text-muted-foreground">
            {t("body")}
          </p>
          <Link
            href="/directory"
            className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px"
          >
            {t("cta")}
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {contacts.length === 0 ? (
            <li className="py-4 text-sm text-muted-foreground">{t("empty")}</li>
          ) : (
            contacts.map((contact) => (
              <li key={contact.name} className="flex items-center gap-4 py-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                  <PhoneCall className="size-5" weight="duotone" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {contact.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {contact.organization ?? contact.category}
                  </span>
                </span>
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="font-mono text-sm tracking-tight text-primary hover:underline"
                  >
                    {contact.phone}
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
