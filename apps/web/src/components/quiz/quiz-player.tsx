"use client";

import { ArrowLeft, ArrowRight, Check, Trophy, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";

type Option = { id: string; label: string };
type Question = { id: string; prompt: string; options: Option[] };
type ReviewItem = {
  questionId: string;
  prompt: string;
  selectedLabel: string | null;
  correctLabel: string | null;
  correct: boolean;
  explanation: string | null;
};

export function QuizPlayer({ slug }: { slug: string }) {
  const t = useTranslations("quiz");
  const [quiz, setQuiz] = useState<{ title: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<
    "loading" | "playing" | "sending" | "done" | "error"
  >("loading");
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    let alive = true;
    apiJson<{ title: string; questions: Question[] }>(`/api/quizzes/${slug}`)
      .then((data) => {
        if (!alive) return;
        setQuiz({ title: data.title });
        setQuestions(data.questions);
        setPhase("playing");
      })
      .catch(() => {
        if (alive) setPhase("error");
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const current = questions[index];
  const selected = current ? answers[current.id] : undefined;

  const advance = () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      return;
    }
    setPhase("sending");
    apiJson<{ score: number; passed: boolean; review: ReviewItem[] }>(`/api/quizzes/${slug}/attempts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        answers: questions.map((q) => ({
          questionId: q.id,
          optionId: answers[q.id] ?? "",
        })),
      }),
    })
      .then(
        (data) => {
          setScore(data.score);
          setPassed(data.passed);
          setReview(data.review);
          setPhase("done");
        },
      )
      .catch(() => setPhase("error"));
  };

  if (phase === "loading") {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
        </div>
      </section>
    );
  }

  if (phase === "error") {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12 text-sm text-destructive">
        {t("error")}
      </section>
    );
  }

  if (phase === "done") {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("result.title")}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight md:text-5xl">
          {t("result.score", { score })}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {passed ? t("result.passed") : t("result.failed")}{" "}
          {t("result.correct", {
            correct: review.filter((r) => r.correct).length,
            total: review.length,
          })}
        </p>
        <ul className="mt-8 divide-y divide-border">
          {review.map((item) => (
            <li key={item.questionId} className="py-4">
              <p className="flex items-start gap-2 text-sm font-semibold">
                {item.correct ? (
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    weight="bold"
                  />
                ) : (
                  <X
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                    weight="bold"
                  />
                )}
                {item.prompt}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.explanation}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/quiz"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:border-primary/50"
          >
            <ArrowLeft className="size-4" /> {t("back")}
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px"
          >
            <Trophy className="size-4" weight="duotone" /> {t("result.retry")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <Link
        href="/quiz"
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> {t("back")}
      </Link>
      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {quiz?.title}
      </h1>
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
        {t("question", { n: index + 1 })} / {questions.length}
      </p>

      {current ? (
        <div className="mt-8 max-w-[40rem]">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {current.prompt}
          </h2>
          <div className="mt-6 space-y-2">
            {current.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, [current.id]: option.id }))
                }
                className={
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors " +
                  (selected === option.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50")
                }
              >
                {option.label}
                {selected === option.id ? (
                  <Check className="size-4 text-primary" weight="bold" />
                ) : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!selected || phase === "sending"}
            onClick={advance}
            className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            {index + 1 < questions.length ? t("next") : t("submit")}{" "}
            <ArrowRight className="size-4" weight="bold" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
