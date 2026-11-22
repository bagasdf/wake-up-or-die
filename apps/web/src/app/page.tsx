import {
  ArrowDown,
  ArrowRight,
  Calculator,
  ChatText,
  Newspaper,
  PhoneCall,
  Question,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Dither from "@/components/shaders/dither-background";

const features = [
  {
    href: "/articles",
    icon: Newspaper,
    title: "Artikel & fakta",
    text: "Kenali zat, risiko, dan cara melindungi diri.",
  },
  {
    href: "/quiz",
    icon: Question,
    title: "Kuis interaktif",
    text: "Uji pengetahuan dan kumpulkan pencapaian.",
  },
  {
    href: "/calculator",
    icon: Calculator,
    title: "Hitung dampaknya",
    text: "Lihat potensi kerugian finansial dan masa depan.",
  },
  {
    href: "/chat",
    icon: ChatText,
    title: "Konsultasi awal",
    text: "Ajukan pertanyaan umum secara privat dan aman.",
  },
  {
    href: "/directory",
    icon: PhoneCall,
    title: "Kontak bantuan",
    text: "Temukan layanan darurat dan rehabilitasi terdekat.",
  },
];

export default function Page(): React.ReactElement {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[720px] overflow-hidden bg-[#120d0c] text-white md:min-h-[820px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 78% 38%, rgba(242,160,148,.72) 0 1.5px, transparent 2px), radial-gradient(circle at 62% 62%, rgba(212,90,69,.38) 0 1px, transparent 2px)",
            backgroundSize: "12px 12px, 8px 8px",
            backgroundPosition: "0 0, 4px 4px",
          }}
        />
        <Dither
          waveColor="#f1a096"
          backgroundColor="#120d0c"
          ditherMode="bayer4"
          colorNum={7}
          pixelSize={4}
          waveSpeed={0.012}
          waveFrequency={4.8}
          waveAmplitude={0.36}
          mouseEffect="erase"
          mouseRadius={0.22}
          palette={["#160e0d", "#36120e", "#751d16", "#d45a45", "#f2a094"]}
          scale={1.35}
          contrast={1.35}
          brightness={0.22}
          mouseStrength={0.32}
          trail={0.42}
          enableMouseInteraction
          intro
          className="absolute inset-0 opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,10,9,.88)_0%,rgba(15,10,9,.42)_54%,rgba(15,10,9,.05)_100%)]" />
        <div className="relative mx-auto flex min-h-[720px] max-w-[1280px] items-center px-5 pt-20 md:min-h-[820px] md:px-8">
          <div className="max-w-[680px] pb-16 md:pb-0">
            <p className="mb-5 border-l-2 border-[#f06b53] pl-3 text-sm font-medium text-white/80">
              Edukasi anti narkoba
            </p>
            <h1 className="font-heading text-[clamp(3.5rem,9vw,7.8rem)] leading-[0.9] font-medium tracking-[-0.04em]">
              Sadar dulu.
              <br />
              <span className="text-[#f06b53]">Sehat terus.</span>
            </h1>
            <p className="mt-7 max-w-[610px] text-base leading-7 text-white/78 md:text-xl md:leading-8">
              Kenali risiko narkoba, uji pengetahuanmu, dan temukan bantuan
              tanpa stigma.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/articles"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#e35f48]"
              >
                Mulai belajar <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                href="/directory"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/8 px-5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/14"
              >
                Cari bantuan <PhoneCall size={18} weight="bold" />
              </Link>
            </div>
          </div>
          <a
            href="#learn"
            aria-label="Lihat fitur"
            className="absolute bottom-8 right-5 grid size-11 place-items-center rounded-full border border-white/25 text-white/70 md:right-8"
          >
            <ArrowDown size={18} />
          </a>
        </div>
      </section>

      <section
        id="learn"
        className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-24"
      >
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Langkah aman</p>
            <h2 className="mt-3 max-w-[18ch] font-heading text-4xl font-medium tracking-tight md:text-5xl">
              Edukasi, bukan takut-takutan
            </h2>
          </div>
          <p className="max-w-[48ch] text-sm leading-7 text-muted-foreground">
            Informasi yang jelas, interaktif, dan mudah dijalankan untuk
            kebutuhan pelajar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature, index) => (
            <Link
              key={feature.href}
              href={
                feature.href as
                  | "/articles"
                  | "/quiz"
                  | "/calculator"
                  | "/chat"
                  | "/directory"
              }
              className="group min-h-[230px] border-t border-border p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={22} weight="duotone" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-10 font-heading text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.text}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-5 mb-16 md:mx-8 md:mb-24">
        <div className="mx-auto grid max-w-[1280px] overflow-hidden rounded-2xl bg-primary text-primary-foreground lg:grid-cols-[1fr_0.72fr]">
          <div className="p-7 md:p-12">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] opacity-70">
              Uji pengetahuanmu
            </p>
            <h2 className="mt-4 max-w-[16ch] font-heading text-4xl font-semibold tracking-tight md:text-5xl">
              Sudah tahu fakta yang benar?
            </h2>
            <p className="mt-4 max-w-[50ch] text-sm leading-7 opacity-85">
              Kerjakan kuis singkat. Dapatkan skor, pelajari kesalahan, dan
              bagikan lencana pencapaianmu.
            </p>
            <Link
              href="/quiz"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-background px-5 text-sm font-bold text-foreground"
            >
              Mulai kuis <ArrowRight size={18} />
            </Link>
          </div>
          <div className="relative hidden min-h-[320px] border-l border-white/15 p-10 lg:flex lg:flex-col lg:justify-between">
            <p className="text-sm text-white/70">Format kuis</p>
            <dl className="grid grid-cols-2 border-t border-white/15 pt-6">
              <div>
                <dt className="text-sm text-white/70">Durasi</dt>
                <dd className="mt-2 font-heading text-4xl">5 menit</dd>
              </div>
              <div className="border-l border-white/15 pl-6">
                <dt className="text-sm text-white/70">Pertanyaan</dt>
                <dd className="mt-2 font-heading text-4xl">10</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
