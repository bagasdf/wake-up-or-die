"use client";

import { ArrowRight, CheckCircle, Timer } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

type Quiz = {
  slug: string;
  title: string;
  description: string;
  questionCount?: number;
};

export function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  useEffect(() => {
    apiJson<Quiz[]>('/api/quizzes')
      .then((d) => setQuizzes(Array.isArray(d) ? d : []))
      .catch(() => setQuizzes([]));
  }, []);
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="grid gap-6 rounded-[28px] bg-primary p-7 text-primary-foreground md:grid-cols-[1fr_280px] md:items-end md:p-12">
        <div>
          <p className="text-sm font-medium text-primary-foreground/70">
            Tes pengetahuan
          </p>
          <h1 className="mt-3 max-w-[16ch] font-heading text-5xl font-medium leading-[0.95] tracking-tight md:text-6xl">
            Seberapa siap kamu mengenali risiko?
          </h1>
        </div>
        <div className="rounded-2xl border border-white/20 p-5">
          <CheckCircle size={28} weight="duotone" />
          <p className="mt-4 text-sm leading-6 opacity-80">
            Selesaikan kuis untuk melihat skor dan mendapatkan lencana.
          </p>
        </div>
      </header>
      {quizzes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
          <Timer size={28} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Kuis sedang disiapkan.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.slug}
              href={`/quiz/${quiz.slug}`}
              className="group flex min-h-[190px] flex-col justify-between border-t border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <div>
                <p className="text-xs font-medium text-primary">Kuis edukasi</p>
                <h2 className="mt-3 font-heading text-2xl font-medium">
                  {quiz.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {quiz.description}
                </p>
              </div>
              <span className="mt-6 flex items-center justify-between text-sm font-bold text-primary">
                <span>{quiz.questionCount ?? 5} pertanyaan</span>
                <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:translate-x-1">
                  <ArrowRight size={16} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
