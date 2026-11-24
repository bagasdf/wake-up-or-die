"use client";

import {
  ArrowRight,
  BookOpenText,
  CheckCircle,
  MagnifyingGlass,
  Timer,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

type Quiz = {
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSeconds: number;
  questionCount?: number;
  attempted?: boolean;
  completed?: boolean;
  hasCertificate?: boolean;
};

const difficultyLabels = {
  easy: "Dasar",
  medium: "Menengah",
  hard: "Lanjutan",
} as const;

const learningCenters = [
  {
    id: "prevention",
    title: "Pencegahan",
    description: "Kenali risiko dan latih cara mengambil keputusan aman.",
    slugs: [
      "mengenal-bahaya-narkoba",
      "keterampilan-menolak-tawaran",
      "mitos-fakta-narkoba",
      "memahami-golongan-zat",
      "membangun-kebiasaan-sehat",
    ],
  },
  {
    id: "impact",
    title: "Dampak dan risiko",
    description: "Pahami efek zat, tanda kecanduan, dan kapan perlu bantuan.",
    slugs: [
      "dampak-zat-pada-otak-remaja",
      "mengenali-tanda-kecanduan",
      "memahami-golongan-zat",
      "mitos-fakta-narkoba",
    ],
  },
  {
    id: "support",
    title: "Dukungan dan pemulihan",
    description: "Belajar mendampingi teman dan menemukan pertolongan tepat.",
    slugs: [
      "pertolongan-dan-pemulihan",
      "dukungan-teman-dan-keluarga",
      "hukum-dan-akses-bantuan",
      "mengenali-tanda-kecanduan",
    ],
  },
] as const;

export function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [activeCenter, setActiveCenter] = useState<string>("all");
  useEffect(() => {
    apiJson<Quiz[]>("/api/quizzes")
      .then((d) => setQuizzes(Array.isArray(d) ? d : []))
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false));
  }, []);

  const visibleQuizzes = quizzes.filter((quiz) => {
    const matchesQuery = `${quiz.title} ${quiz.description}`
      .toLocaleLowerCase("id")
      .includes(query.toLocaleLowerCase("id"));
    const matchesCenter =
      activeCenter === "all" ||
      learningCenters.some(
        (center) =>
          center.id === activeCenter &&
          center.slugs.some((slug) => slug === quiz.slug),
      );
    return (
      matchesQuery &&
      matchesCenter &&
      (difficulty === "all" || quiz.difficulty === difficulty)
    );
  });

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="grid gap-6 border-b border-border pb-9 md:grid-cols-[1fr_280px] md:items-end md:pb-12">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpenText size={18} weight="duotone" /> Pusat belajar
          </p>
          <h1 className="mt-4 max-w-[14ch] font-heading text-5xl font-medium leading-[0.98] tracking-tight md:text-7xl">
            Belajar mengenali risiko.
          </h1>
          <p className="mt-4 max-w-[54ch] text-base leading-7 text-muted-foreground">
            Materi singkat, lalu uji pemahamanmu. Lulus kuis untuk mendapat
            sertifikat digital.
          </p>
        </div>
        <div className="border-l-2 border-primary py-1 pl-5">
          <p className="font-heading text-4xl font-semibold">
            {quizzes.length || "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            modul belajar tersedia
          </p>
          <Link
            href="/me"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Lihat sertifikat <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="learning-centers-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="learning-centers-title"
              className="font-heading text-2xl font-semibold"
            >
              Pilih pusat belajar
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tiga jalur, sepuluh kuis. Setiap kuis berisi sedikitnya 10
              pertanyaan.
            </p>
          </div>
          <button
            type="button"
            aria-pressed={activeCenter === "all"}
            onClick={() => setActiveCenter("all")}
            className={`rounded-full border px-4 py-2 text-sm ${activeCenter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            Semua jalur
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {learningCenters.map((center) => (
            <button
              key={center.id}
              type="button"
              aria-pressed={activeCenter === center.id}
              onClick={() => setActiveCenter(center.id)}
              className={`min-h-36 border-t-2 p-4 text-left transition-colors ${activeCenter === center.id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}
            >
              <span className="font-heading text-xl font-semibold">
                {center.title}
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                {center.description}
              </span>
              <span className="mt-3 block text-xs font-semibold text-primary">
                {
                  quizzes.filter((quiz) =>
                    center.slugs.some((slug) => slug === quiz.slug),
                  ).length
                }{" "}
                modul
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-input px-4 md:w-[min(100%,360px)]">
          <MagnifyingGlass size={18} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari topik belajar"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Filter tingkat kesulitan</legend>
          {["all", "easy", "medium", "hard"].map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={difficulty === level}
              onClick={() => setDifficulty(level)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${difficulty === level ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
            >
              {level === "all"
                ? "Semua"
                : difficultyLabels[level as keyof typeof difficultyLabels]}
            </button>
          ))}
        </fieldset>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {["one", "two", "three", "four"].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
          <Timer size={28} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Materi belum tersedia. Coba lagi nanti.
          </p>
        </div>
      ) : visibleQuizzes.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Tidak ada materi yang cocok. Ubah kata kunci atau filter.
        </p>
      ) : (
        <div className="mt-6 grid gap-x-6 md:grid-cols-2">
          {visibleQuizzes.map((quiz) => (
            <Link
              key={quiz.slug}
              href={`/quiz/${quiz.slug}`}
              className="group flex min-h-[190px] flex-col justify-between border-b border-border py-6 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {difficultyLabels[quiz.difficulty]}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${quiz.completed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {quiz.hasCertificate
                        ? "Sertifikat tersedia"
                        : quiz.completed
                          ? "Sudah selesai"
                          : quiz.attempted
                            ? "Sudah dicoba"
                            : "Belum selesai"}
                    </span>
                  </div>
                  <h2 className="mt-4 font-heading text-2xl font-medium">
                    {quiz.title}
                  </h2>
                  <p className="mt-2 max-w-[56ch] text-sm leading-6 text-muted-foreground">
                    {quiz.description}
                  </p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight size={17} />
                </span>
              </div>
              <span className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{quiz.questionCount ?? 0} pertanyaan</span>
                <span>{Math.ceil(quiz.timeLimitSeconds / 60)} menit</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <CheckCircle size={14} /> Sertifikat jika lulus
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
