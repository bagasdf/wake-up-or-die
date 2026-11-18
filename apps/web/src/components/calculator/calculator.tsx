"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Calculator as CalculatorIcon, Receipt, Warning } from "@phosphor-icons/react";

type Result = {
  months: number;
  totalSpent: number;
  investmentGain: number;
  careerLoss: number;
  healthCost: number;
  legalCost: number;
  totalImpact: number;
  riskLevel: "rendah" | "sedang" | "tinggi";
  equivalents: {
    motorcycles: number;
    laptops: number;
    schoolSemesters: number;
    familyTrips: number;
  };
  recommendations: string[];
  disclaimer: string;
};

export function Calculator() {
  const t = useTranslations("calculator");
  const locale = useLocale();
  const [monthlySpend, setMonthlySpend] = useState("");
  const [durationYears, setDurationYears] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [age, setAge] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const formatIDR = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(false);
    fetch("/api/calculator/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        monthlySpend: Number(monthlySpend),
        durationYears: Number(durationYears),
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        age: age ? Number(age) : undefined,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { result: Result }) => setResult(data.result))
      .catch(() => setError(true))
      .finally(() => setSending(false));
  };

  const rows: Array<[string, number]> = result
    ? [
        [t("spent"), result.totalSpent],
        [t("investment"), result.investmentGain],
        [t("career"), result.careerLoss],
        [t("health"), result.healthCost],
        [t("legal"), result.legalCost],
      ]
    : [];

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">{t("subtitle")}</p>

      <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">{t("monthlySpend")}</span>
          <input
            type="number"
            min={0}
            required
            value={monthlySpend}
            onChange={(e) => setMonthlySpend(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("durationYears")}</span>
          <input
            type="number"
            min={0.1}
            max={50}
            step={0.5}
            required
            value={durationYears}
            onChange={(e) => setDurationYears(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("monthlyIncome")}</span>
          <input
            type="number"
            min={0}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("age")}</span>
          <input
            type="number"
            min={10}
            max={90}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            <CalculatorIcon className="size-4" weight="duotone" /> {t("submit")}
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

      {result ? (
        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-[1.25rem] border bg-primary p-6 text-primary-foreground">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] opacity-80">
              {t("total")}
            </p>
            <p className="mt-2 font-mono text-3xl tracking-tight md:text-4xl">
              {formatIDR(result.totalImpact)}
            </p>
            <p className="mt-2 text-sm opacity-80">
              {t("riskLabel")}: {t(`risk.${result.riskLevel}`)}
            </p>
          </div>
          <ul className="divide-y divide-border rounded-[1.25rem] border">
            {rows.map(([label, value]) => (
              <li key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono tracking-tight">{formatIDR(value)}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-[1.25rem] border p-6">
            <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              <Receipt className="size-4" weight="duotone" /> {t("equivalents")}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <li>{result.equivalents.motorcycles} {t("motorcycles")}</li>
              <li>{result.equivalents.laptops} {t("laptops")}</li>
              <li>{result.equivalents.schoolSemesters} {t("schoolSemesters")}</li>
              <li>{result.equivalents.familyTrips} {t("familyTrips")}</li>
            </ul>
          </div>
          <div className="rounded-[1.25rem] border p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("recommendations")}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {result.recommendations.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <Warning className="mt-0.5 size-4 shrink-0 text-primary" weight="duotone" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground md:col-span-2">{result.disclaimer}</p>
        </div>
      ) : null}
    </section>
  );
}
