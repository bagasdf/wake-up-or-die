"use client";

import {
  Clock,
  MagnifyingGlass,
  Phone,
  ShieldCheck,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

const categories = [
  "darurat",
  "bnn",
  "rehabilitasi",
  "hotline",
  "lainnya",
] as const;
const labels: Record<string, string> = {
  darurat: "Darurat",
  bnn: "BNN",
  rehabilitasi: "Rehabilitasi",
  hotline: "Hotline",
  lainnya: "Lainnya",
};
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
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      let alive = true;
      const params = new URLSearchParams({ perPage: "50" });
      if (category) params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      apiJson<{ items: Contact[] }>(`/api/directory/contacts?${params}`)
        .then(
          (data) => alive && setContacts(data.items ?? []),
        )
        .catch(() => alive && setError(true))
        .finally(() => alive && setError(false));
      return () => {
        alive = false;
      };
    }, 250);
    return () => window.clearTimeout(timer);
  }, [category, query]);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="border-b border-border pb-8">
        <p className="text-sm font-medium text-primary">Bantuan terpercaya</p>
        <h1 className="mt-3 font-heading text-5xl font-medium tracking-tight md:text-6xl">
          Temukan bantuan.
        </h1>
        <p className="mt-4 max-w-[55ch] text-sm leading-7 text-muted-foreground">
          Kontak darurat, lembaga rehabilitasi, dan layanan konseling yang dapat
          dijangkau.
        </p>
      </header>
      <div className="mt-7 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex h-12 max-w-sm items-center gap-3 rounded-xl border border-input px-4">
          <MagnifyingGlass size={18} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kota atau lembaga"
            className="h-full w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`rounded-lg px-4 py-2 text-sm ${category === null ? "bg-primary text-primary-foreground" : "border border-border"}`}
          >
            Semua
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-lg px-4 py-2 text-sm ${category === item ? "bg-primary text-primary-foreground" : "border border-border"}`}
            >
              {labels[item]}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Direktori tidak dapat dimuat. Coba lagi sebentar.
        </p>
      ) : contacts === null ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 border-t border-border bg-muted/40"
            />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Tidak ada kontak yang cocok.
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-lg font-medium">
                      {contact.name}
                    </h2>
                    {contact.isVerified && (
                      <ShieldCheck
                        size={17}
                        className="text-primary"
                        weight="duotone"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {contact.organization ??
                      labels[contact.category] ??
                      contact.category}
                    {contact.city ? ` · ${contact.city}` : ""}
                  </p>
                </div>
                {contact.is24h && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    <Clock size={12} /> 24 JAM
                  </span>
                )}
              </div>
              <div className="mt-5 flex gap-2">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-xs font-bold hover:border-primary/50"
                  >
                    <Phone size={15} /> Telepon
                  </a>
                )}
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-xs font-bold text-primary-foreground"
                  >
                    <WhatsappLogo size={15} /> WhatsApp
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
