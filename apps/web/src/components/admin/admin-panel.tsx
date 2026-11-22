"use client";

import { Check, Shield, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";

type Article = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
};
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
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "umum",
    status: "draft",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setError(false);
    apiJson<{ user: { role: string } }>("/api/me")
      .then((data) => {
        setRole(data.user.role);
        return Promise.all([
          apiJson<{ items: Comment[] }>(
            "/api/admin/comments?status=pending&perPage=20",
          )
            .then((commentsData) => setComments(commentsData.items ?? []))
            .catch(() => setComments([])),
          apiJson<{ items: Article[] }>("/api/admin/articles?perPage=20")
            .then((articlesData) => setArticles(articlesData.items ?? []))
            .catch(() => setArticles([])),
        ]);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = (id: string, status: "approved" | "rejected") => {
    apiJson<Comment>(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((comment) =>
        setComments((prev) =>
          prev
            ? prev.map((item) => (item.id === comment.id ? comment : item))
            : prev,
        ),
      )
      .catch(() => {});
  };

  const createArticle = (event: React.FormEvent) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setFormError(null);
    apiJson<Article>("/api/admin/articles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    })
      .then((created) => {
        setArticles((prev) => (prev ? [created, ...prev] : prev));
        setShowForm(false);
        setDraft({
          title: "",
          excerpt: "",
          content: "",
          category: "umum",
          status: "draft",
        });
      })
      .catch(() => setFormError(t("formError")))
      .finally(() => setCreating(false));
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

      {tab === "articles" ? (
        <div className="mt-8">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px"
          >
            {t("newArticle")}
          </button>
          {showForm ? (
            <form
              onSubmit={createArticle}
              className="mt-4 grid grid-cols-1 gap-3 rounded-[1.25rem] border p-5 md:grid-cols-2"
            >
              <label className="block">
                <span className="text-sm font-medium">{t("title")}</span>
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">{t("category")}</span>
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, category: e.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {["jenis", "dampak", "pencegahan", "hukum", "umum"].map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium">{t("excerpt")}</span>
                <input
                  required
                  minLength={3}
                  maxLength={300}
                  value={draft.excerpt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, excerpt: e.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium">{t("content")}</span>
                <textarea
                  required
                  minLength={10}
                  value={draft.content}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, content: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">{t("status")}</span>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, status: e.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="draft">{t("status.draft")}</option>
                  <option value="published">{t("status.published")}</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
                >
                  {t("create")}
                </button>
              </div>
              {formError ? (
                <p
                  className="text-sm text-destructive md:col-span-2"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}
            </form>
          ) : null}
          {articles === null ? (
            <div className="mt-6 animate-pulse h-24 rounded-[1.25rem] border" />
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {articles
                .filter((article) =>
                  query.trim()
                    ? article.title
                        .toLowerCase()
                        .includes(query.toLowerCase()) ||
                      article.slug.toLowerCase().includes(query.toLowerCase())
                    : true,
                )
                .map((article) => (
                  <li
                    key={article.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="truncate">{article.title}</span>
                    <span className="ml-4 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t(`status.${article.status}`)} · {article.category}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : comments === null ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="animate-pulse h-20 rounded-[1.25rem] border"
            />
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
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {comment.content}
              </p>
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
      )}
    </section>
  );
}
