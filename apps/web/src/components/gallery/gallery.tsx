"use client";

import { Download } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";

const types = ["poster", "infografis", "video", "lainnya"] as const;

type Asset = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  thumbnailUrl: string | null;
  fileKey: string | null;
  downloadCount: number;
};

const fallbacks = [
  "/static/images/poster-1.png",
  "/static/images/poster-2.png",
  "/static/images/poster-3.png",
  "/static/images/poster-4.png",
];

export function Gallery() {
  const t = useTranslations("gallery");
  const [type, setType] = useState<string | null>(null);
  const [items, setItems] = useState<Asset[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let alive = true;
      setError(false);
      const params = new URLSearchParams({ perPage: "24" });
      if (type) params.set("type", type);
      apiJson<{ items: Asset[] }>(`/api/gallery?${params}`)
        .then((data) => {
          if (alive) setItems(data.items ?? []);
        })
        .catch(() => {
          if (alive) setError(true);
        });
      return () => {
        alive = false;
      };
    }, 200);
    return () => window.clearTimeout(timer);
  }, [type]);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Media kampanye
        </p>
        <h1 className="mt-3 font-heading text-5xl font-semibold tracking-tight md:text-6xl">
          Poster & infografis.
        </h1>
        <p className="mt-4 max-w-[55ch] text-sm leading-7 text-muted-foreground">
          Unduh bahan visual untuk kampanye, kelas, atau komunitas.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setType(null)}
          className={
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
            (type === null
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:border-primary/50")
          }
        >
          {t("all")}
        </button>
        {types.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
              (type === item
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary/50")
            }
          >
            {t(`types.${item}`)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-8 text-sm text-destructive">{t("error")}</p>
      ) : items === null ? (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse aspect-[3/4] rounded-[1.25rem] bg-muted"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((item, i) => {
            const href = item.url ?? `/api/media/${item.fileKey ?? ""}`;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[1.25rem] border"
              >
                <div className="relative aspect-[3/4] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.thumbnailUrl ??
                      item.url ??
                      fallbacks[i % fallbacks.length]
                    }
                    alt={item.title}
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
                    {t(`types.${item.type}`)}
                  </p>
                  <h2 className="mt-1 truncate font-heading text-sm font-semibold tracking-tight">
                    {item.title}
                  </h2>
                  {href ? (
                    <a
                      href={href}
                      download
                      className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:border-primary/50"
                    >
                      <Download className="size-3.5" weight="bold" />{" "}
                      {t("download")}
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
