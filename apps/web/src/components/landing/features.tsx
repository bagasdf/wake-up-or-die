"use client";

import { useTranslations } from "next-intl";
import {
  Calculator,
  ChatTeardropText,
  NotePencil,
  Newspaper,
  PhoneCall,
  Question,
} from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";

const iconClass = "size-6";

export function Features() {
  const t = useTranslations("landing.features");

  const items = [
    {
      key: "articles",
      href: "/articles",
      icon: <Newspaper className={iconClass} weight="duotone" />,
      span: "md:col-span-2",
    },
    {
      key: "quiz",
      href: "/quiz",
      icon: <Question className={iconClass} weight="duotone" />,
      span: "",
      tint: "bg-primary/10",
    },
    {
      key: "calculator",
      href: "/calculator",
      icon: <Calculator className={iconClass} weight="duotone" />,
      span: "",
    },
    {
      key: "chat",
      href: "/chat",
      icon: <ChatTeardropText className={iconClass} weight="duotone" />,
      span: "",
      tint: "bg-muted",
    },
    {
      key: "directory",
      href: "/directory",
      icon: <PhoneCall className={iconClass} weight="duotone" />,
      span: "",
    },
    {
      key: "report",
      href: "/reports",
      icon: <NotePencil className={iconClass} weight="duotone" />,
      span: "md:col-span-3",
      tint: "bg-primary text-primary-foreground",
    },
  ];

  return (
    <section className="mx-3 md:m-12 mb-6 rounded-[2rem] border px-8 py-12">
      <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h2>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">
        {t("subtitle")}
      </p>
      <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={
              "group rounded-[1.25rem] border p-6 transition-colors hover:border-primary/50 " +
              item.span +
              " " +
              (item.tint ?? "")
            }
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background group-hover:bg-primary group-hover:text-primary-foreground group-aria-[tint]:border-transparent">
              {item.icon}
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">
              {t(`items.${item.key}.title`)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`items.${item.key}.description`)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
