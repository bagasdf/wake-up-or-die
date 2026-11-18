"use client";

import { useTranslations } from "next-intl";
import { Check, Shield, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

type Article = { id: string; title: string; slug: string; status: string; category: string };
type Comment = {
  id: string;
  authorName: string;
  content: string;
  status: string;
  articleTitle: string;
  createdAt: string;
};

export function AdminPanel() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<"articles" | "comments">("comments");
  const [role, setRole] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setError(false);
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user: { role: string } } | null) => {
        setRole(data?.user.role ?? null);
        if (!data) return;
        return fetch(`/api/admin/comments?status=pending&perPage=20`)
          .then((res) => (res.ok ? res.json() : { items: [] }))
          .then((data: { items: Comment[] }) => setComments(data.items ?? []));
      })
      .then(() =>
        fetch("/api/admin/articles?perPage=20")
          .then((res) => (res.ok ? res.json() : { items: [] }))
          .then((data: { items: Article[] }) => setArticles(data.items ?? []))
          .catch(() => {}),
      )
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = (id: string, status: "approved" | "rejected") => {
    fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((comment: Comment) =>
        setComments((prev) =>
          prev ? prev.map((item) => (item.id === comment.id ? comment : item)) : prev,
        ),
      )
      .catch(() => {});
  };

  if (role === null && !error) {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
        <div className="animate-pulse h-8 w-1/3 rounded bg-muted" />
      </section>
    );
  }

  if (role !== "admin") {
    return (
      <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
          <Shield className="size-5" weight="duotone" /> {t("unauthorized")}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h1>

      <div className="mt-8 flex gap-2">
        {(["comments", "articles"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
              (tab === item
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary/50")
            }
          >
            {t(item)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-8 text-sm text-destructive">
          {t("error")}{" "}
          <button type="button" onClick={load} className="underline">
            {t("retry")}
          </button>
        </p>
      ) : null}

      {tab === "comments" ? (
        comments === null ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-20 rounded-[1.25rem] border" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="mt-8 divide-y divide-border">
            {comments.map((comment) => (
              <li key={comment.id} className="py-4">
                <p className="text-sm font-semibold">
                  {comment.authorName}{" "}
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t(`status.${comment.status}`)} · {comment.articleTitle}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{comment.content}</p>
                {comment.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => moderate(comment.id, "approved")}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
                    >
                      <Check className="size-4" weight="bold" /> {t("approve")}
                    </button>
                    <button
                      type="button"
                      onClick={() => moderate(comment.id, "rejected")}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:border-destructive/50"
                    >
                      <X className="size-4" weight="bold" /> {t("reject")}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="mt-8">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          {articles === null ? (
            <div className="mt-6 animate-pulse h-24 rounded-[1.25rem] border" />
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {articles
                .filter((article) =>
                  query.trim()
                    ? article.title.toLowerCase().includes(query.toLowerCase()) ||
                      article.slug.toLowerCase().includes(query.toLowerCase())
                    : true,
                )
                .map((article) => (
                  <li key={article.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="truncate">{article.title}</span>
                    <span className="ml-4 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t(`status.${article.status}`)} · {article.category}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
