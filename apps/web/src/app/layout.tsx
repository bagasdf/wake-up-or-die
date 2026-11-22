import type { Metadata } from "next";
import { Geist_Mono, Lora, Manrope } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/nav/footer";
import { Navbar } from "@/components/nav/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sadar atau Mati — Wake Up or Die",
  description: "Website edukasi anti narkoba untuk pelajar dan masyarakat.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        manrope.variable,
        lora.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
