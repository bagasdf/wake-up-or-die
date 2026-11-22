"use client";

import { Calculator as CalculatorIcon, Warning } from "@phosphor-icons/react";
import { useState } from "react";
import { useLocale } from "@/lib/i18n";

type Result = {
  monthlySpend?: number;
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
        ["Pengeluaran", result.totalSpent],
        ["Nilai investasi hilang", result.investmentGain],
        ["Potensi karier", result.careerLoss],
        ["Biaya kesehatan", result.healthCost],
        ["Risiko hukum", result.legalCost],
      ]
    : [];

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="border-b border-border pb-8">
        <p className="text-sm font-medium text-primary">Simulasi dampak</p>
        <h1 className="mt-3 font-heading text-5xl font-medium tracking-tight md:text-6xl">
          Hitung kerugiannya.
        </h1>
        <p className="mt-4 max-w-[55ch] text-sm leading-7 text-muted-foreground">
          Perkirakan konsekuensi finansial dan peluang masa depan untuk membuat
          keputusan yang lebih sadar.
        </p>
      </header>
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <form
          onSubmit={submit}
          className="h-fit rounded-2xl border border-border bg-card p-5 md:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label className="block">
              <span className="text-xs font-bold">Pengeluaran per bulan</span>
              <div className="mt-2 flex h-12 items-center rounded-xl border border-input px-3">
                <span className="mr-2 text-sm text-muted-foreground">Rp</span>
                <input
                  type="number"
                  min={0}
                  required
                  value={monthlySpend}
                  onChange={(event) => setMonthlySpend(event.target.value)}
                  className="h-full w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold">Durasi estimasi</span>
              <div className="mt-2 flex h-12 items-center rounded-xl border border-input px-3">
                <input
                  type="number"
                  min={0.1}
                  max={50}
                  step={0.5}
                  required
                  value={durationYears}
                  onChange={(event) => setDurationYears(event.target.value)}
                  className="h-full w-full bg-transparent text-sm outline-none"
                />
                <span className="text-sm text-muted-foreground">tahun</span>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold">
                Penghasilan per bulan{" "}
                <span className="text-muted-foreground">(opsional)</span>
              </span>
              <div className="mt-2 flex h-12 items-center rounded-xl border border-input px-3">
                <span className="mr-2 text-sm text-muted-foreground">Rp</span>
                <input
                  type="number"
                  min={0}
                  value={monthlyIncome}
                  onChange={(event) => setMonthlyIncome(event.target.value)}
                  className="h-full w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold">
                Usia <span className="text-muted-foreground">(opsional)</span>
              </span>
              <div className="mt-2 flex h-12 items-center rounded-xl border border-input px-3">
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  className="h-full w-full bg-transparent text-sm outline-none"
                />
                <span className="text-sm text-muted-foreground">tahun</span>
              </div>
            </label>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <CalculatorIcon size={18} />{" "}
            {sending ? "Menghitung..." : "Hitung dampak"}
          </button>
          {error && (
            <p className="mt-3 text-sm text-destructive">
              Estimasi gagal. Periksa nilai lalu coba lagi.
            </p>
          )}
        </form>
        {result ? (
          <div className="grid gap-3">
            <div className="rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                Estimasi total dampak
              </p>
              <p className="mt-3 font-mono text-4xl tracking-tight md:text-5xl">
                {formatIDR(result.totalImpact)}
              </p>
              <p className="mt-3 text-sm opacity-80">
                Risiko: {result.riskLevel}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ul className="divide-y divide-border rounded-2xl border border-border p-5">
                {rows.map(([label, value]) => (
                  <li
                    key={label}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <strong className="text-right">{formatIDR(value)}</strong>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-border p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Setara dengan
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong className="block text-2xl">
                      {result.equivalents.motorcycles}
                    </strong>
                    <span className="text-muted-foreground">motor</span>
                  </div>
                  <div>
                    <strong className="block text-2xl">
                      {result.equivalents.laptops}
                    </strong>
                    <span className="text-muted-foreground">laptop</span>
                  </div>
                  <div>
                    <strong className="block text-2xl">
                      {result.equivalents.schoolSemesters}
                    </strong>
                    <span className="text-muted-foreground">semester</span>
                  </div>
                  <div>
                    <strong className="block text-2xl">
                      {result.equivalents.familyTrips}
                    </strong>
                    <span className="text-muted-foreground">liburan</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                <Warning size={16} /> Langkah berikutnya
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                {result.recommendations.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                {result.disclaimer}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <div>
              <CalculatorIcon
                size={48}
                weight="thin"
                className="mx-auto text-muted-foreground"
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Masukkan estimasi untuk melihat potensi dampak.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
