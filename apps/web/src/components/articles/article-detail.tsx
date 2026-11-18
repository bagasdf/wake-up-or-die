"use client";

import { ArrowLeft, ChatCircle, PaperPlaneRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  category: string;
  readingMinutes: number;
  publishedAt: string | null;
  related: Array<{ slug: string; title: string; excerpt: string }>;
};

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export function ArticleDetail({ slug }: { slug: string }) {
  const t = useTranslations("articles");
  const locale = useLocale();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState<
    "loading" | "error" | "ready" | "notfound"
  >("loading");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetch(`/api/articles/${slug}`)
      .then((res) =>
        res.ok ? res.json() : res.status === 404 ? null : Promise.reject(),
      )
      .then((data: Article | null) => {
        if (!alive) return;
        if (!data) {
          setState("notfound");
          return;
        }
        setArticle(data);
        setState("ready");
        return fetch(`/api/articles/${slug}/comments?perPage=20`)
          .then((res) => (res.ok ? res.json() : { items: [] }))
          .then(
            (c: { items: Comment[] }) => alive && setComments(c.items ?? []),
          )
          .catch(() => {});
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    fetch(`/api/articles/${slug}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorName: name.trim() || undefined,
        content: content.trim(),
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((comment: Comment) => {
        setComments((prev) => [comment, ...prev]);
        setContent("");
        setNotice(t("comments.pending"));
      })
      .catch(() => setNotice(t("comments.error")))
      .finally(() => setSending(false));
  };

  if (state === "loading") {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-muted" />
          <div className="aspect-[16/9] rounded-[1.25rem] bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12 text-sm text-destructive">
        {t("error")}
      </section>
    );
  }

  if (state === "notfound" || !article) {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        <Link
          href="/articles"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> {t("back")}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <Link
        href="/articles"
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> {t("back")}
      </Link>
      <h1 className="mt-6 max-w-[24ch] font-heading text-4xl font-semibold tracking-tight md:text-5xl">
        {article.title}
      </h1>
      <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="rounded-full border border-border px-2 py-0.5">
          {t(`categories.${article.category}`)}
        </span>{" "}
        {article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString(locale, {
              dateStyle: "medium",
            })
          : ""}{" "}
        · {t("minutes", { minutes: article.readingMinutes })}
      </p>
      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[1.25rem] bg-muted">
        <Image
          src={
            article.coverImageUrl ??
            `https://picsum.photos/seed/wuod-${article.slug}/1200/675`
          }
          alt={article.title}
          fill
          sizes="(min-width: 768px) 70vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="mt-8 max-w-[65ch] space-y-4 text-[15px] leading-relaxed">
        {article.content.split(/\n\s*\n/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {article.related.length > 0 ? (
        <div className="mt-12">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {t("related")}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {article.related.map((item) => (
              <Link
                key={item.slug}
                href={`/articles/${item.slug}`}
                className="rounded-[1.25rem] border p-5 transition-colors hover:border-primary/50"
              >
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-12 max-w-[40rem]">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
          <ChatCircle className="size-5" weight="duotone" />{" "}
          {t("comments.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("comments.subtitle")}
        </p>

        <ul className="mt-6 divide-y divide-border">
          {comments.length === 0 ? (
            <li className="py-4 text-sm text-muted-foreground">
              {t("comments.empty")}
            </li>
          ) : (
            comments.map((comment) => (
              <li key={comment.id} className="py-4">
                <p className="text-sm font-semibold">{comment.authorName}</p>
                <p className="mt-1 text-sm leading-relaxed">
                  {comment.content}
                </p>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString(locale, {
                    dateStyle: "medium",
                  })}
                </p>
              </li>
            ))
          )}
        </ul>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label htmlFor="comment-name" className="text-sm font-medium">
              {t("comments.name")}
            </label>
            <input
              id="comment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div>
            <label htmlFor="comment-content" className="text-sm font-medium">
              {t("comments.content")}
            </label>
            <textarea
              id="comment-content"
              required
              minLength={3}
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            <PaperPlaneRight className="size-4" weight="bold" />{" "}
            {t("comments.submit")}
          </button>
          {notice ? (
            <div className="text-sm text-muted-foreground" role="status">
              {notice}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
