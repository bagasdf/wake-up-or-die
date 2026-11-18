"use client";

import { locales } from "@wuod/i18n";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import FlagEN from "#/public/static/flags/en.svg";
import FlagID from "#/public/static/flags/id.svg";

import { AccountMenu } from "@/components/core/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", key: "home" },
  { href: "/articles", key: "articles" },
  { href: "/quiz", key: "quiz" },
  { href: "/calculator", key: "calculator" },
  { href: "/directory", key: "directory" },
  { href: "/chat", key: "chat" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full">
      <nav
        className={cn(
          "mx-3 md:m-12 mt-3 flex h-14 items-center justify-between rounded-[2rem] border px-4 transition-all duration-300",
          scrolled
            ? "border-border bg-background/80 backdrop-blur shadow-sm"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="flex items-center gap-3 select-none">
          <Image
            src="/static/images/logo.svg"
            alt="Wake Up or Die"
            className="size-8"
            width={32}
            height={32}
          />
          <span className="font-heading text-sm font-semibold tracking-tight">
            wake up or die
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  pathname === link.href &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {locales.map((l) => (
              <Link
                key={l}
                href={pathname ?? "/"}
                locale={l}
                aria-label={l === "id" ? "Bahasa Indonesia" : "English"}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
                  locale !== l && "opacity-50 hover:opacity-100",
                )}
              >
                <Image
                  src={l === "id" ? FlagID : FlagEN}
                  alt={l === "id" ? "Bahasa Indonesia" : "English"}
                  className="size-6"
                  width={24}
                  height={24}
                />
              </Link>
            ))}
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
