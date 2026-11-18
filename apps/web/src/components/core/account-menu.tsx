"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { SignOut, User } from "@phosphor-icons/react";

type Me = { user: { name: string | null; email: string } };

export function AccountMenu() {
  const t = useTranslations("auth");
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Me | null) => {
        if (alive) setMe(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const logout = () => {
    fetch("/api/auth/sign-out", { method: "POST" }).finally(() => {
      window.location.href = "/";
    });
  };

  if (!me) {
    return (
      <Link
        href="/login"
        className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:border-primary/50"
      >
        <User className="size-4" weight="duotone" /> {t("account")}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/me"
        className="inline-flex h-11 max-w-40 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:border-primary/50"
      >
        <User className="size-4 shrink-0" weight="duotone" />
        <span className="truncate">{me.user.name ?? me.user.email}</span>
      </Link>
      <button
        type="button"
        onClick={logout}
        aria-label={t("logout")}
        className="inline-flex size-11 items-center justify-center rounded-lg border border-border transition-colors hover:border-primary/50"
      >
        <SignOut className="size-4" weight="duotone" />
      </button>
    </div>
  );
}
