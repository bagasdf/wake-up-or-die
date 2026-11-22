import Image from "next/image";
import Link from "next/link";

const links = [
  ["Artikel", "/articles"],
  ["Kuis", "/quiz"],
  ["Bantuan", "/directory"],
  ["Konsultasi", "/chat"],
  ["Laporkan", "/reports"],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Image
                  src="/static/images/logo.svg"
                  alt=""
                  width={32}
                  height={32}
                />
              </span>
              <span>
                <strong className="block font-heading text-lg">
                  Wake Up or Die
                </strong>
                <span className="text-xs text-muted-foreground">
                  Sadar, kuat, bebas narkoba.
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-[50ch] text-sm leading-7 text-muted-foreground">
              Platform edukasi anti narkoba berbasis bukti untuk pelajar,
              keluarga, dan masyarakat.
            </p>
          </div>
          <nav
            aria-label="Navigasi footer"
            className="flex flex-wrap gap-x-5 gap-y-3 md:justify-end"
          >
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SMKN 6 Kota Tangerang Selatan — Kelompok 6 RPL 2.</p>
          <p>Informasi edukasi. Bukan pengganti bantuan medis profesional.</p>
        </div>
      </div>
    </footer>
  );
}
