"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import type { Locale } from "@wuod/i18n";

const links = [
  { href: "/articles", key: "articles" },
  { href: "/quiz", key: "quiz" },
  { href: "/calculator", key: "calculator" },
  { href: "/directory", key: "directory" },
  { href: "/reports", key: "report" },
  { href: "/chat", key: "chat" },
] as const;

export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations();

  return (
    <footer className="mx-3 mb-3 rounded-[2rem] border bg-foreground p-8 text-background md:mx-12 md:mb-12">
      <div className="flex flex-col justify-between gap-8 md:flex-row">
        <div className="max-w-[36ch]">
          <p className="font-heading text-lg font-semibold tracking-tight">
            wake up or die
          </p>
          <p className="mt-2 text-sm opacity-70">{t("footer.tagline")}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              locale={locale}
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              {t(`nav.${link.key}`)}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.22em] opacity-50">
        © {new Date().getFullYear()} wake up or die · {t("footer.rights")}
      </p>
    </footer>
  );
}
