import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/20 backdrop-blur">
      <nav className="flex h-14 items-center justify-between px-6">
        <Link href="/" className="font-heading text-lg">
          lockinme
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
