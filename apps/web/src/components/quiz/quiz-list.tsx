"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Trophy } from "@phosphor-icons/react";

type Quiz = {
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  passScore: number;
  questionCount: number;
};

export function QuizList() {
  const t = useTranslations("quiz");
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/quizzes")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Quiz[]) => {
        if (alive) setQuizzes(data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">{t("subtitle")}</p>

      {error ? (
        <p className="mt-8 text-sm text-destructive">{t("error")}</p>
      ) : quizzes === null ? (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[1.25rem] border p-6">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="mt-3 h-3 w-full rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.slug}
              className="flex flex-col rounded-[1.25rem] border p-6 transition-colors hover:border-primary/50"
            >
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {t(`difficulty.${quiz.difficulty}`)} · {t("questions", { count: quiz.questionCount })}
              </p>
              <h2 className="mt-3 font-heading text-xl font-semibold tracking-tight">
                {quiz.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{quiz.description}</p>
              <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("pass", { score: quiz.passScore })}
              </p>
              <Link
                href={`/quiz/${quiz.slug}`}
                className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px"
              >
                <Trophy className="size-4" weight="duotone" /> {t("start")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
