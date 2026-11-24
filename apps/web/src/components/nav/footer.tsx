import { Plus } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const columns = [
  {
    title: "Jelajahi",
    links: [
      ["Belajar", "/articles"],
      ["Kuis", "/quiz"],
      ["Galeri", "/gallery"],
    ],
  },
  {
    title: "Dukungan",
    links: [
      ["Kontak bantuan", "/directory"],
      ["Konsultasi", "/chat"],
      ["Laporkan", "/reports"],
    ],
  },
  {
    title: "Akun",
    links: [
      ["Dasbor pengguna", "/me"],
      ["Lencana", "/badges"],
      ["Masuk", "/login"],
    ],
  },
] as const;

const tapTarget =
  "max-md:inline-flex max-md:min-h-11 max-md:items-center pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 pb-8 pt-12 md:grid-cols-12 md:gap-10 md:px-8 md:pb-10 md:pt-16">
        <div className="md:col-span-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center">
              <Image
                src="/static/images/logo.svg"
                alt=""
                width={22}
                height={28}
              />
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight">
              Wake Up or Die
            </span>
          </Link>
          <p className="mt-4 max-w-[38ch] text-sm leading-6 text-muted-foreground">
            Edukasi anti narkoba berbasis bukti untuk pelajar, keluarga, dan
            masyarakat. Sadar, kuat, bebas narkoba.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-emerald-500"
            />
            Informasi edukasi tersedia untuk semua.
          </p>
        </div>

        <nav
          aria-label="Navigasi footer"
          className="footer-desktop-links col-span-6 col-start-7 grid-cols-3 gap-6"
        >
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-3 grid gap-1">
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "text-sm text-muted-foreground transition-colors hover:text-foreground",
                        tapTarget,
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <nav
          aria-label="Navigasi footer"
          className="footer-mobile-links -mx-3 gap-1"
        >
          {columns.map((column) => (
            <details
              key={column.title}
              className="group rounded-xl open:bg-muted/50"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-semibold">{column.title}</span>
                <Plus
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform group-open:rotate-45"
                />
              </summary>
              <ul className="px-3 pb-2">
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block py-3 text-sm text-muted-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-5 pb-4 text-xs text-muted-foreground md:flex-row md:items-center md:gap-6 md:px-8">
        <p>© 2026 SMKN 6 Kota Tangerang Selatan — Kelompok 6 RPL 2.</p>
        <p className="md:ml-auto">
          Informasi edukasi, bukan pengganti bantuan medis profesional.
        </p>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.2em] select-none bg-gradient-to-b from-primary/30 to-transparent bg-clip-text text-center text-[clamp(72px,18vw,250px)] leading-[0.82] tracking-[-0.06em] text-transparent"
        style={{ fontFamily: "var(--font-lora)", fontWeight: 500 }}
      >
        Wake Up or Die
      </p>
    </footer>
  );
}
