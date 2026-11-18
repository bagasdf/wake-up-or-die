"use client";

import { useTranslations } from "next-intl";
import { PaperPlaneRight, Ticket } from "@phosphor-icons/react";
import { useState } from "react";

export function ReportForm() {
  const t = useTranslations("report");
  const [category, setCategory] = useState("konsultasi");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState("tidak_ada");
  const [contactValue, setContactValue] = useState("");
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(false);
    fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        category,
        subject,
        message,
        contactMethod,
        contactValue: contactValue.trim() || undefined,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { ticketCode: string }) => setTicket(data.ticketCode))
      .catch(() => setError(true))
      .finally(() => setSending(false));
  };

  const inputClass =
    "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">{t("subtitle")}</p>

      {ticket ? (
        <div className="mt-8 flex items-center gap-3 rounded-[1.25rem] border border-primary/40 bg-primary/10 p-6">
          <Ticket className="size-6 shrink-0 text-primary" weight="duotone" />
          <p className="text-sm">
            {t("success", { code: ticket })}{" "}
            <button
              type="button"
              onClick={() => {
                setTicket(null);
                setSubject("");
                setMessage("");
              }}
              className="font-semibold text-primary underline"
            >
              {t("retry")}
            </button>
          </p>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">{t("category")}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="konsultasi">{t("categories.konsultasi")}</option>
            <option value="pengaduan">{t("categories.pengaduan")}</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("contactMethod")}</span>
          <select
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value)}
            className={inputClass}
          >
            <option value="tidak_ada">{t("methods.tidak_ada")}</option>
            <option value="whatsapp">{t("methods.whatsapp")}</option>
            <option value="email">{t("methods.email")}</option>
            <option value="telepon">{t("methods.telepon")}</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">{t("subject")}</span>
          <input
            required
            minLength={5}
            maxLength={150}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          />
        </label>
        {contactMethod !== "tidak_ada" ? (
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">{t("contactValue")}</span>
            <input
              required
              minLength={3}
              maxLength={120}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">{t("message")}</span>
          <textarea
            required
            minLength={10}
            maxLength={5000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            <PaperPlaneRight className="size-4" weight="bold" /> {t("submit")}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-6 text-sm text-destructive">
          {t("error")}{" "}
          <button type="button" onClick={submit} className="underline">
            {t("retry")}
          </button>
        </p>
      ) : null}
    </section>
  );
}
