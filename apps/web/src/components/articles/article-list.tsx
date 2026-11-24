"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArticleCover } from "@/components/articles/article-cover";
import { apiJson } from "@/lib/api";

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImageUrl: string | null;
};
export function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    apiJson<{ items?: Article[] }>("/api/articles")
      .then((d) => setArticles(d?.items ?? []))
      .catch(() => setArticles([]));
  }, []);
  const filtered = articles.filter((item) =>
    `${item.title} ${item.category} ${item.excerpt}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1fr_360px] md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Pusat pengetahuan</p>
          <h1 className="mt-3 font-heading text-5xl font-medium tracking-tight md:text-6xl">
            Artikel & fakta
          </h1>
          <p className="mt-4 max-w-[55ch] text-sm leading-7 text-muted-foreground">
            Informasi ringkas, jelas, dan dapat ditindaklanjuti tentang risiko
            serta pencegahan narkoba.
          </p>
        </div>
        <label className="flex h-12 items-center gap-3 rounded-xl border border-input bg-background px-4">
          <MagnifyingGlass size={18} className="text-muted-foreground" />
          <span className="sr-only">Cari artikel</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari topik"
            className="h-full w-full bg-transparent text-sm outline-none"
          />
        </label>
      </header>
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Belum ada artikel yang cocok.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group overflow-hidden border-b border-border bg-card pb-5 transition-colors hover:border-primary"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <ArticleCover
                  slug={article.slug}
                  coverImageUrl={article.coverImageUrl}
                  alt={article.title}
                  sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-primary">
                  {article.category}
                </p>
                <h2 className="mt-2 font-heading text-xl font-medium leading-snug">
                  {article.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
