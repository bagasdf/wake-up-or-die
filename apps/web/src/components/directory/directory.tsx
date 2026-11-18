"use client";

import { useTranslations } from "next-intl";
import { Clock, Phone, ShieldCheck, WhatsappLogo } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const categories = ["darurat", "bnn", "rehabilitasi", "hotline", "lainnya"] as const;

type Contact = {
  id: string;
  name: string;
  organization: string | null;
  category: string;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  province: string | null;
  is24h: boolean;
  isVerified: boolean;
};

export function Directory() {
  const t = useTranslations("directory");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let alive = true;
      setError(false);
      const params = new URLSearchParams({ perPage: "50" });
      if (category) params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      fetch(`/api/directory/contacts?${params}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: { items: Contact[] }) => {
          if (alive) setContacts(data.items ?? []);
        })
        .catch(() => {
          if (alive) setError(true);
        });
      return () => {
        alive = false;
      };
    }, 250);
    return () => window.clearTimeout(timer);
  }, [category, query]);

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
              (category === null
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary/50")
            }
          >
            {t("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
                (category === cat
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:border-primary/50")
              }
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-8 text-sm text-destructive">{t("error")}</p>
      ) : contacts === null ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 rounded-[1.25rem] border" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-8 divide-y divide-border">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex flex-wrap items-center gap-4 py-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                <Phone className="size-5" weight="duotone" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {contact.name}
                  {contact.isVerified ? (
                    <ShieldCheck className="size-4 text-primary" weight="duotone" />
                  ) : null}
                  {contact.is24h ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-primary">
                      <Clock className="size-3" weight="bold" /> {t("hours24")}
                    </span>
                  ) : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {contact.organization ?? t(`categories.${contact.category}`)}
                  {contact.city ? ` · ${contact.city}` : ""}
                </span>
              </span>
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs tracking-tight hover:border-primary/50"
                >
                  {contact.phone}
                </a>
              ) : null}
              {contact.whatsapp ? (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  <WhatsappLogo className="size-3.5" weight="bold" /> {t("whatsapp")}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
