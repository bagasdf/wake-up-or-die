"use client";

import {
  CaretDown,
  DotsThree,
  Hamburger,
  MoonIcon,
  SignOut,
  SunIcon,
  User,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-transition"), 300);
  };

  const handleSignOut = () => {
    setProfileOpen(false);
    // sign-out is handled via same-origin POST redirect by the backend
    window.location.href = "/api/auth/sign-out";
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/company", label: "Company" },
    { href: "/products", label: "Products", hasChevron: true },
    { href: "/team", label: "Team" },
    { href: "/features", label: "Features" },
    { href: "/services", label: "Services" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  const overflowLinks = [
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="border-b bg-background sm:border-0 sm:bg-transparent">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section frame: full-width stack of two tiers */}
        <div className="flex flex-col sm:flex-row items-start sm-items-center justify-between gap-4 sm:gap-6">
          {/* ===== TOP TIER ===== */}
          <section className="flex flex-col sm:flex-row items-start sm-items-center justify-between gap-4 w-full py-4 sm:py-6 border-b sm:border-0">
            {/* Brand cluster */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 text-primary hover:text-primary/90 transition-colors"
              >
                <svg
                  className="size-5 text-primary fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="font-semibold tracking-tighter">Brand</span>
              </Link>
            </div>

            {/* Utility cluster: icon-only group */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className={cn(
                  "p-2 rounded-md hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isDark ? "bg-dark/20" : "bg-light/20",
                )}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </Button>
              {/* Notification */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className={cn(
                  "p-2 rounded-md hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isDark ? "bg-dark/20" : "bg-light/20",
                )}
              >
                <svg
                  className="size-4 fill-current text-muted"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 22c1.1 0 2.2-.1 3.3-.3L20.3 15.5c-.6-1.5-2.7-1.8-3.6-1.2L9.8 18.8c.6 1.5 2.7 1.8 3.6 1.2c1.1.1 2.2.1 3.3.1zM12 2L4.53 7.53L9.66 12.19L12 15.08L14.34 12.19L19.47 7.53L12 2Z" />
                </svg>
              </Button>
              {/* Profile dropdown */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border border-border bg-background p-0 text-primary hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isDark ? "bg-dark/20" : "bg-light/20",
                  )}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <User className="size-5 fill-current" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover p-2 shadow-lg z-50">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm">
                      <User className="size-4 fill-current text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">User Name</div>
                        <div className="text-xs text-muted-foreground truncate">
                          user@example.com
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border" />
                    <a
                      href="/me"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
                    >
                      <svg
                        className="size-4 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16z" />
                      </svg>
                      Profile
                    </a>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-red-50 transition-colors text-left"
                    >
                      <SignOut className="size-4 fill-current" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              {/* Logout text link */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:text-primary/90 transition-colors"
              >
                <SignOut className="size-4 fill-current" /> Sign Out
              </button>
            </div>
          </section>

          {/* ===== BOTTOM TIER ===== */}
          <section className="flex items-center gap-1 px-0 py-3 sm:py-0">
            <ul className="flex gap-4 sm:gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium tracking-tight transition-colors hover:text-primary"
                  >
                    {link.hasChevron ? (
                      <>
                        {link.label}{" "}
                        <CaretDown className="size-4 fill-current text-muted hover:text-primary transition-colors ml-1" />
                      </>
                    ) : (
                      link.label
                    )}
                  </Link>
                </li>
              ))}
              {/* Overflow trigger */}
              <li>
                <button
                  type="button"
                  onClick={() => setOverflowOpen((o) => !o)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border border-border bg-background p-0 text-primary hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isDark ? "bg-dark/20" : "bg-light/20",
                  )}
                  aria-expanded={overflowOpen}
                  aria-haspopup="menu"
                >
                  <DotsThree className="size-4 fill-current" />
                </button>
                {overflowOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-lg border border-border bg-popover p-2 shadow-lg z-50">
                    {overflowLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            </ul>
          </section>
        </div>

        {/* Mobile menu toggle (hamburger) - hidden above 768px */}
        <button
          type="button"
          className="ds-menu-toggle mx-4 sm:px-6 lg:px-8 flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-primary hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-haspopup="menu"
        >
          <Hamburger className="size-5 fill-current" />
        </button>

        {/* Collapsible panel beneath bottom tier */}
        {mobileOpen && (
          <div className="mx-4 sm:px-6 lg:px-8 mt-3 border border-border rounded-lg bg-popover p-4 shadow-lg z-50">
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block text-sm font-medium tracking-tight py-2 text-primary hover:bg-accent transition-colors rounded-md"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
