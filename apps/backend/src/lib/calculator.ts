export type CalculatorInput = {
  monthlySpend: number;
  durationYears: number;
  monthlyIncome?: number;
  age?: number;
};

export type CalculatorResult = {
  months: number;
  totalSpent: number;
  investmentGain: number;
  careerLoss: number;
  healthCost: number;
  legalCost: number;
  totalImpact: number;
  dailySpend: number;
  perYearSpend: number;
  riskLevel: "rendah" | "sedang" | "tinggi";
  productiveYearsAtRisk: number;
  equivalents: {
    motorcycles: number;
    laptops: number;
    schoolSemesters: number;
    familyTrips: number;
  };
  summary: string;
  recommendations: string[];
  disclaimer: string;
};

const ANNUAL_RETURN = 0.06;
const HEALTH_COST_PER_YEAR = 3_600_000;
const LEGAL_COST_LOW = 5_000_000;
const LEGAL_COST_HIGH = 15_000_000;

function round(value: number): number {
  return Math.round(value);
}

/**
 * Transparent, conservative estimate in IDR. Every component is returned
 * separately so the UI can explain where the number comes from.
 */
export function estimateImpact(input: CalculatorInput): CalculatorResult {
  const months = Math.max(1, Math.round(input.durationYears * 12));
  const totalSpent = round(input.monthlySpend * months);

  const monthlyRate = ANNUAL_RETURN / 12;
  const futureValue =
    input.monthlySpend > 0
      ? input.monthlySpend * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : 0;
  const investmentGain = round(Math.max(futureValue - totalSpent, 0));

  const income = input.monthlyIncome ?? 0;
  const careerLoss = round(income * 12 * input.durationYears * 0.2);
  const healthCost = round(input.durationYears * HEALTH_COST_PER_YEAR);
  const legalCost = input.durationYears >= 1 ? LEGAL_COST_HIGH : LEGAL_COST_LOW;

  const totalImpact = round(totalSpent + investmentGain + careerLoss + healthCost + legalCost);
  const dailySpend = round(totalSpent / (input.durationYears * 365));
  const perYearSpend = round(totalSpent / Math.max(input.durationYears, 0.1));

  const riskLevel: CalculatorResult["riskLevel"] =
    totalImpact > 200_000_000 ? "tinggi" : totalImpact > 50_000_000 ? "sedang" : "rendah";

  return {
    months,
    totalSpent,
    investmentGain,
    careerLoss,
    healthCost,
    legalCost,
    totalImpact,
    dailySpend,
    perYearSpend,
    riskLevel,
    productiveYearsAtRisk: Math.round(input.durationYears * 0.2 * 10) / 10,
    equivalents: {
      motorcycles: Math.floor(totalImpact / 25_000_000),
      laptops: Math.floor(totalImpact / 10_000_000),
      schoolSemesters: Math.floor(totalImpact / 5_000_000),
      familyTrips: Math.floor(totalImpact / 15_000_000),
    },
    summary:
      `Dengan pengeluaran Rp${input.monthlySpend.toLocaleString("id-ID")} per bulan selama ` +
      `${input.durationYears} tahun, total uang yang terpakai mencapai ` +
      `Rp${totalSpent.toLocaleString("id-ID")}. Bila diinvestasikan, nilainya bisa tumbuh ` +
      `menjadi Rp${round(totalSpent + investmentGain).toLocaleString("id-ID")}.`,
    recommendations: [
      "Catat pengeluaran bulanan dan alihkan dana ke tabungan atau investasi yang aman.",
      "Cari pendampingan konselor sekolah, BNN, atau layanan kesehatan jiwa terdekat.",
      "Isi waktu dengan kegiatan produktif: olahraga, komunitas, atau keterampilan baru.",
      "Jauhi lingkungan dan kontak yang menawarkan narkoba, dan berani minta bantuan.",
    ],
    disclaimer:
      "Angka ini adalah estimasi edukatif, bukan perhitungan medis atau finansial resmi. " +
      "Hasil dapat berbeda tergantung pola penggunaan dan kondisi masing-masing.",
  };
}
