"use client";

import {
  ArrowRight,
  List,
  Moon,
  SignOut,
  Sun,
  User,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/articles", label: "Belajar" },
  { href: "/quiz", label: "Kuis" },
  { href: "/directory", label: "Bantuan" },
  { href: "/chat", label: "Konsultasi" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [me, setMe] = useState<{
    user?: { name?: string | null; email: string; role?: string };
  } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    apiJson<{ user: { name?: string | null; email: string; role?: string } }>(
      "/api/me",
    )
      .then(setMe)
      .catch(() => setMe(null));
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), []);

  const toggleTheme = () => {
    document.documentElement.classList.add("theme-transition");
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    window.setTimeout(
      () => document.documentElement.classList.remove("theme-transition"),
      300,
    );
  };

  const signOut = () => {
    fetch("/api/auth/sign-out", { method: "POST", redirect: "follow" }).finally(
      () => {
        window.location.assign("/");
      },
    );
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <nav
        className={cn(
          "mx-auto flex h-16 max-w-[1280px] items-center justify-between rounded-2xl border px-3 transition-all md:px-5",
          scrolled
            ? "border-border/80 bg-background/88 text-foreground shadow-[0_12px_40px_rgba(20,10,5,0.10)] backdrop-blur-xl"
            : "border-border/20 bg-card/88 text-foreground shadow-[0_12px_36px_rgba(20,10,5,0.12)] backdrop-blur-xl",
        )}
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Wake Up or Die — Beranda"
        >
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
            <Image
              src="/static/images/logo.svg"
              alt=""
              width={28}
              height={28}
              className="size-7 w-auto"
            />
          </span>
          <span className="hidden font-heading text-[15px] font-bold tracking-tight sm:block">
            Wake Up or Die
          </span>
        </Link>

        <div className="absolute left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = item.href === pathname;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "relative z-20 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti tema"
            className="grid size-9 place-items-center rounded-lg text-foreground/78 transition-colors hover:bg-accent/12 hover:text-foreground"
          >
            {!mounted || resolvedTheme !== "dark" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-label="Menu akun"
              aria-expanded={accountOpen}
              className="grid size-9 place-items-center rounded-lg border border-current/15 opacity-80 transition hover:opacity-100"
            >
              <User size={18} />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl border border-border bg-background p-2 text-foreground shadow-2xl">
                {me?.user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">
                        {me.user.name ?? "Pengguna"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {me.user.email}
                      </p>
                    </div>
                    <Link
                      href="/me"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      Profil & pencapaian
                    </Link>
                    {me.user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      >
                        Panel admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={signOut}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <SignOut size={16} /> Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="mt-1 flex items-center justify-between rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                    >
                      Daftar <ArrowRight size={16} />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Buka menu"
            aria-expanded={open}
            className="hidden size-9 place-items-center rounded-lg border border-current/15 md:hidden"
          >
            <List size={20} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-[1280px] rounded-2xl border border-border bg-background p-2 text-foreground shadow-2xl md:hidden">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
