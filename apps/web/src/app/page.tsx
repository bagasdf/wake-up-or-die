import {
  ArrowDown,
  ArrowRight,
  Calculator,
  ChatText,
  Newspaper,
  PhoneCall,
  Question,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
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
] as const;

const articles = [
  {
    href: "/articles/mengenal-jenis-narkoba-dan-efeknya",
    image: "/static/images/pil.png",
    alt: "Ilustrasi pil untuk artikel pengenalan jenis zat",
    category: "Mengenal zat",
    title: "Kenali jenis zat dan risikonya",
    text: "Pahami informasi dasar tanpa mencoba atau menormalisasi penggunaan.",
  },
  {
    href: "/articles/dampak-narkoba-pada-otak-remaja",
    image: "/static/images/teen-brain.png",
    alt: "Ilustrasi perkembangan otak remaja",
    category: "Dampak kesehatan",
    title: "Apa yang terjadi pada otak remaja?",
    text: "Pelajari kaitan zat adiktif dengan fokus, memori, dan pengambilan keputusan.",
  },
  {
    href: "/articles/cara-menolak-tawaran-narkoba",
    image: "/static/images/recovery-support.jpg",
    alt: "Pekerja sosial berbicara dengan seorang warga",
    category: "Keterampilan aman",
    title: "Menolak tawaran dengan tegas",
    text: "Siapkan kalimat sederhana dan rencana keluar dari situasi berisiko.",
  },
] as const;

const questions = [
  {
    question:
      "Apakah perubahan perilaku selalu berarti seseorang memakai narkoba?",
    answer:
      "Tidak. Perubahan dapat memiliki banyak penyebab. Mulai dengan bertanya dan mendengarkan, bukan menuduh.",
  },
  {
    question: "Apa yang harus dilakukan jika seseorang sulit bernapas?",
    answer:
      "Anggap sebagai keadaan darurat. Hubungi layanan darurat atau bawa ke IGD terdekat.",
  },
  {
    question: "Apakah informasi di situs ini menggantikan bantuan profesional?",
    answer:
      "Tidak. Materi ini untuk edukasi umum, bukan diagnosis, perawatan medis, atau nasihat hukum.",
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
        <div
          aria-hidden="true"
          className="home-ascii pointer-events-none absolute right-0 top-28 w-[44%] overflow-hidden font-mono text-[10px] leading-[1.45] text-[#f2a094]/50"
        >
          <div className="ascii-loop-track flex w-max">
            <pre className="pr-12">{`     .::::.       .::::.       .::::.       .::::.\n   .::::::::.   .::::::::.   .::::::::.   .::::::::.\n  :::::::::::: :::::::::::: :::::::::::: ::::::::::::\n   '::::::::'   '::::::::'   '::::::::'   '::::::::'\n      '::'         '::'         '::'         '::'\n   .----.       .----.       .----.       .----.\n  / safe \\     / safe \\     / safe \\     / safe \\\n  \\____/      \\____/      \\____/      \\____/`}</pre>
            <pre aria-hidden="true">{`     .::::.       .::::.       .::::.       .::::.\n   .::::::::.   .::::::::.   .::::::::.   .::::::::.\n  :::::::::::: :::::::::::: :::::::::::: ::::::::::::\n   '::::::::'   '::::::::'   '::::::::'   '::::::::'\n      '::'         '::'         '::'         '::'\n   .----.       .----.       .----.       .----.\n  / safe \\     / safe \\     / safe \\     / safe \\\n  \\____/      \\____/      \\____/      \\____/`}</pre>
          </div>
        </div>
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
                href="/quiz"
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
        <div className="home-section-heading mb-9">
          <div>
            <p className="text-sm font-medium text-primary">Mulai dari sini</p>
            <h2 className="mt-3 max-w-[18ch] font-heading text-4xl font-medium tracking-tight md:text-5xl">
              Pahami. Pilih langkah aman.
            </h2>
          </div>
          <p className="max-w-[48ch] text-sm leading-7 text-muted-foreground">
            Informasi jelas membantu kita mengenali risiko, merespons tekanan,
            dan mencari bantuan tanpa mempermalukan siapa pun.
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

      <section className="border-y border-border bg-muted/35">
        <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-24">
          <div className="home-section-heading mb-10">
            <div>
              <p className="text-sm font-medium text-primary">
                Tiga jalur belajar
              </p>
              <h2 className="mt-3 max-w-[18ch] font-heading text-4xl font-medium tracking-tight md:text-5xl">
                Pilih yang kamu perlukan hari ini.
              </h2>
            </div>
            <p className="max-w-[48ch] text-sm leading-7 text-muted-foreground">
              Belajar bisa dimulai dari pencegahan, memahami dampak, atau
              mendampingi seseorang menuju dukungan yang tepat.
            </p>
          </div>
          <div className="grid gap-0 border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
            {(
              [
                {
                  number: "01",
                  title: "Pencegahan",
                  text: "Kenali tekanan sosial dan latih cara menjaga batas pribadi.",
                  href: "/articles/cara-menolak-tawaran-narkoba",
                },
                {
                  number: "02",
                  title: "Dampak dan risiko",
                  text: "Pahami pengaruh zat pada kesehatan, hubungan, dan keseharian.",
                  href: "/articles/dampak-narkoba-pada-otak-remaja",
                },
                {
                  number: "03",
                  title: "Dukungan dan pemulihan",
                  text: "Temukan langkah untuk meminta bantuan dan mendampingi tanpa stigma.",
                  href: "/articles/gejala-awal-kecanduan-dan-cara-mencari-bantuan",
                },
              ] as const
            ).map((path) => (
              <Link
                key={path.number}
                href={path.href}
                className="group border-b border-border px-5 py-7 transition-colors hover:bg-background md:border-b-0 md:px-7"
              >
                <span className="font-mono text-xs text-primary">
                  {path.number}
                </span>
                <h3 className="mt-5 font-heading text-2xl font-semibold">
                  {path.title}
                </h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                  {path.text}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Baca materi <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-24">
        <div className="home-section-heading mb-10">
          <div>
            <p className="text-sm font-medium text-primary">Bacaan pilihan</p>
            <h2 className="mt-3 max-w-[18ch] font-heading text-4xl font-medium tracking-tight md:text-5xl">
              Pengetahuan yang bisa dipakai.
            </h2>
          </div>
          <p className="max-w-[48ch] text-sm leading-7 text-muted-foreground">
            Mulai dari dasar, pahami dampak kesehatan, lalu simpan langkah
            praktis yang ingin kamu ingat.
          </p>
        </div>
        <div className="grid gap-7 md:grid-cols-3">
          {articles.map((article) => (
            <article key={article.href} className="min-w-0">
              <Link href={article.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <Image
                    src={article.image}
                    alt={article.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-5 text-xs font-semibold text-primary">
                  {article.category}
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight group-hover:text-primary">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {article.text}
                </p>
              </Link>
            </article>
          ))}
        </div>
        <Link
          href="/articles"
          className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Lihat semua artikel <ArrowRight size={16} />
        </Link>
      </section>

      <section className="bg-[#17110f] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-medium text-[#f2a094]">
              Untuk diri sendiri atau teman
            </p>
            <h2 className="mt-3 max-w-[14ch] font-heading text-4xl font-medium tracking-tight md:text-5xl">
              Kamu tidak harus mencari bantuan sendirian.
            </h2>
            <p className="mt-5 max-w-[48ch] text-sm leading-7 text-white/70">
              Mulai dengan orang dewasa tepercaya, konselor, tenaga kesehatan,
              atau layanan resmi. Jika ada bahaya langsung, hubungi layanan
              darurat atau datangi IGD.
            </p>
            <Link
              href="/directory"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#17110f]"
            >
              Cari kontak bantuan <PhoneCall size={17} />
            </Link>
          </div>
          <div className="border-t border-white/20 lg:border-l lg:border-t-0 lg:pl-10">
            <h3 className="font-heading text-2xl font-semibold">
              Pertanyaan umum
            </h3>
            <div className="mt-4 divide-y divide-white/15">
              {questions.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="cursor-pointer list-none pr-6 font-medium marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-3 max-w-[65ch] text-sm leading-6 text-white/70">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-white/55">
              Informasi di situs ini bersifat edukatif dan bukan pengganti
              diagnosis, perawatan medis, atau nasihat hukum.
            </p>
          </div>
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
