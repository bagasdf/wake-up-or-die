"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { useHome } from "./home-data";

function cover(slug: string, url: string | null) {
  return url ?? `https://picsum.photos/seed/wuod-${slug}/800/500`;
}

export function ArticlesPreview() {
  const t = useTranslations("landing.articles");
  const { data } = useHome();
  const articles = data?.latestArticles?.slice(0, 3) ?? [];

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h2>
        <Link
          href="/articles"
          className="font-mono text-xs uppercase tracking-[0.18em] text-primary hover:underline"
        >
          {t("readMore")}
        </Link>
      </div>
      {articles.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group overflow-hidden rounded-[1.25rem] border transition-colors hover:border-primary/50"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={cover(article.slug, article.coverImageUrl)}
                  alt={article.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-5">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
                  {article.category}
                </p>
                <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight">
                  {article.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
