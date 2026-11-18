"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const categories = ["jenis", "dampak", "pencegahan", "hukum", "umum"] as const;

const posters = [
  "/static/images/poster-1.png",
  "/static/images/poster-2.png",
  "/static/images/poster-3.png",
  "/static/images/poster-4.png"
];

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string;
  readingMinutes: number;
  publishedAt: string | null;
};

export function ArticleList() {
  const t = useTranslations("articles");
  const locale = useLocale();
  const [category, setCategory] = useState<string | null>(null);
  const [items, setItems] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ perPage: "6", page: "1" });
    if (category) params.set("category", category);
    fetch(`/api/articles?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: Article[]; total: number }) => {
        if (!alive) return;
        setItems(data.items);
        setHasMore(data.items.length < data.total);
        setPage(1);
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [category]);

  const loadMore = () => {
    const next = page + 1;
    const params = new URLSearchParams({ perPage: "6", page: String(next) });
    if (category) params.set("category", category);
    fetch(`/api/articles?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: Article[]; total: number }) => {
        setItems((prev) => [...prev, ...data.items]);
        setHasMore(
          data.items.length > 0 &&
            items.length + data.items.length < data.total,
        );
        setPage(next);
      })
      .catch(() => {});
  };

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">
        {t("subtitle")}
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
            (category === null
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:border-primary/50")
          }
        >
          {t("all")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
              (category === cat
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary/50")
            }
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-8 text-sm text-destructive">
          {t("error")}{" "}
          <button
            type="button"
            onClick={() => setCategory(category)}
            className="underline"
          >
            {t("retry")}
          </button>
        </p>
      ) : loading && items.length === 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="animate-pulse rounded-[1.25rem] border p-5"
            >
              <div className="aspect-[16/10] rounded-xl bg-muted" />
              <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
              <div className="mt-2 h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            {items.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group overflow-hidden rounded-[1.25rem] border transition-colors hover:border-primary/50"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <Image
                    src={
                      article.coverImageUrl ??
                      `https://picsum.photos/seed/wuod-${article.slug}/800/500`
                    }
                    alt={article.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
                    {t(`categories.${article.category}`)}
                  </p>
                  <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight">
                    {article.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString(
                          locale,
                          {
                            dateStyle: "medium",
                          },
                        )
                      : ""}{" "}
                    · {t("minutes", { minutes: article.readingMinutes })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {hasMore ? (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:border-primary/50"
              >
                {t("loadMore")}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
