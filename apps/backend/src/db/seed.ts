import { eq, sql } from "drizzle-orm";

import { createAuth } from "../lib/auth";
import { createDb } from "./index";
import {
  articles,
  badges,
  helpContacts,
  mediaAssets,
  quizOptions,
  quizQuestions,
  quizzes,
  siteSettings,
  user,
} from "./schema";

type ProcessLike = {
  env?: Record<string, string | undefined>;
  exit?: (code?: number) => never;
};

const proc = (globalThis as unknown as { process?: ProcessLike }).process;

const env = proc?.env ?? {};

const DATABASE_URL = env.DATABASE_URL ?? "";
const ADMIN_EMAIL = env.SEED_ADMIN_EMAIL ?? "admin@wuod.local";
const ADMIN_PASSWORD = env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
const ADMIN_NAME = env.SEED_ADMIN_NAME ?? "Administrator WUOD";

if (!DATABASE_URL) {
  console.error("DATABASE_URL belum diisi. Jalankan: bun --env-file=.dev.vars run src/db/seed.ts");
  proc?.exit?.(1);
}

const db = createDb(DATABASE_URL);

async function seedAdmin(): Promise<string> {
  const auth = createAuth({
    DATABASE_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ?? "seed-secret-seed-secret-seed-secret12",
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    WEB_ORIGIN: env.WEB_ORIGIN,
    APP_NAME: env.APP_NAME,
  });

  try {
    await auth.api.signUpEmail({
      body: { name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    console.log(`Admin dibuat: ${ADMIN_EMAIL}`);
  } catch {
    console.log(`Admin sudah ada atau gagal dibuat, memakai akun yang ada: ${ADMIN_EMAIL}`);
  }

  const [admin] = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL)).limit(1);
  if (!admin) {
    throw new Error(
      "Tidak bisa menemukan akun admin. Pastikan BETTER_AUTH_SECRET stabil dan coba lagi.",
    );
  }

  await db.update(user).set({ role: "admin" }).where(eq(user.id, admin.id));
  return admin.id;
}

type SeedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "jenis" | "dampak" | "pencegahan" | "hukum" | "umum";
  readingMinutes: number;
  seriesSlug?: string;
  seriesOrder?: number;
  coverImageUrl?: string;
};

const ARTICLE_SEED: SeedArticle[] = [
  {
    slug: "mengenal-jenis-narkoba-dan-efeknya",
    title: "Mengenal Jenis Narkoba dan Efeknya pada Tubuh",
    excerpt:
      "Ganja, sabu, ekstasi, hingga zat baru seperti synthetic cannabinoid. Kenali golongan, bentuk, dan efek jangka pendeknya.",
    category: "jenis",
    readingMinutes: 8,
    seriesSlug: "dasar-anti-narkoba",
    seriesOrder: 1,
    coverImageUrl:
      "https://placehold.co/1200x630/0f766e/ffffff?text=Jenis+Narkoba+dan+Efeknya",
    content: `## Apa itu narkoba?

Narkoba adalah singkatan dari narkotika, psikotropika, dan bahan adiktif lainnya. Dalam dunia medis, beberapa zat golongan ini dipakai untuk terapi dengan pengawasan ketat. Masalah muncul ketika zat tersebut dipakai tanpa indikasi medis, dengan dosis berlebihan, atau secara berulang untuk mencari sensasi.

## Golongan yang perlu dikenal

- **Depresan** memperlambat kerja sistem saraf. Contohnya opioid dan benzodiazepin. Efeknya mengantuk, menekan pernapasan, dan mudah menimbulkan ketergantungan.
- **Stimulan** mempercepat kerja tubuh. Contohnya amfetamin dan metamfetamin (sabu). Pengguna bisa terjaga berjam-jam, jantung berdebar, dan mudah panik.
- **Halusinogen** mengubah persepsi. Contohnya LSD dan psilosibin. Pengguna dapat melihat atau mendengar sesuatu yang tidak nyata.
- **Ganja** berada di golongan tersendiri. Zat THC-nya memengaruhi daya ingat, konsentrasi, dan motivasi.

## Tanda awal yang perlu diwaspadai

Perubahan pola tidur, mata merah, berat badan turun drastis, mudah marah, menarik diri dari keluarga, dan hilangnya minat pada hobi bisa menjadi sinyal awal. Namun tanda-tanda ini tidak selalu berarti penyalahgunaan narkoba. Yang penting adalah membuka percakapan, bukan langsung menuduh.

## Yang bisa dilakukan

Jangan mencoba zat apa pun untuk "sekadar tahu". Jika kamu atau orang terdekat sudah terlibat, minta bantuan tenaga kesehatan atau layanan BNN. Berhenti lebih awal jauh lebih mudah daripada menunggu ketergantungan makin dalam.`,
  },
  {
    slug: "dampak-narkoba-pada-otak-remaja",
    title: "Dampak Narkoba pada Otak Remaja",
    excerpt:
      "Otak remaja masih berkembang. Zat adiktif dapat mengganggu fokus, memori, dan kemampuan mengambil keputusan jangka panjang.",
    category: "dampak",
    readingMinutes: 7,
    seriesSlug: "dasar-anti-narkoba",
    seriesOrder: 2,
    coverImageUrl:
      "https://placehold.co/1200x630/0f766e/ffffff?text=Otak+Remaja+dan+Narkoba",
    content: `## Otak yang sedang dibangun

Hingga usia sekitar 25 tahun, otak terus membentuk koneksi baru, terutama di bagian yang mengatur perencanaan, pengendalian diri, dan penilaian risiko. Zat adiktif masuk ke sistem penghargaan otak dan membanjirinya dengan sinyal senang yang jauh lebih kuat daripada aktivitas biasa.

## Akibat yang sering muncul

1. **Sulit fokus belajar.** Gangguan memori jangka pendek membuat materi pelajaran cepat hilang.
2. **Mood tidak stabil.** Naik-turun zat membuat suasana hati mudah berubah dan memicu kecemasan.
3. **Keputusan berisiko.** Bagian otak yang menahan diri bekerja lebih lemah, sehingga remaja lebih mudah mengambil keputusan impulsif.
4. **Ketergantungan.** Tubuh menuntut dosis lebih besar untuk rasa senang yang sama.

## Kabar baiknya

Otak remaja juga sangat lentur. Ketika seseorang berhenti memakai zat dan mendapat dukungan yang tepat, fungsi kognitif dapat membaik secara bertahap. Olahraga teratur, tidur cukup, dan lingkungan yang suportif membantu proses pemulihan.

## Kapan mencari bantuan

Jika penggunaan zat sudah mengganggu sekolah, hubungan keluarga, atau membuat seseorang sulit berhenti meski ingin, itu tanda perlu bantuan profesional. Hubungi layanan kesehatan jiwa atau BNN di 184.`,
  },
  {
    slug: "cara-menolak-tawaran-narkoba",
    title: "Cara Menolak Tawaran Narkoba Tanpa Drama",
    excerpt:
      "Teknik menolak yang sopan tapi tegas, mulai dari alasan singkat sampai cara keluar dari situasi berisiko.",
    category: "pencegahan",
    readingMinutes: 6,
    seriesSlug: "keterampilan-bertahan",
    seriesOrder: 1,
    coverImageUrl:
      "https://placehold.co/1200x630/0f766e/ffffff?text=Cara+Menolak+Narkoba",
    content: `## Menolak bukan berarti tidak gaul

Tekanan teman sering terasa besar karena takut dikucilkan. Padahal, menolak sesuatu yang berbahaya justru menunjukkan bahwa kamu punya pendirian. Kamu tidak perlu berpidato panjang; cukup jawaban singkat yang tegas.

## Kalimat yang bisa dipakai

- "Nggak, aku lagi fokus sama latihan/tim."
- "Aku nggak mau, badan gua sensi sama zat kayak gitu."
- "Kalau mau nongkrong, ayo cari tempat lain. Aku tetap ikut."
- "Aku udah janji sama orang tua dan diri sendiri buat nggak nyentuh itu."

Ucapkan dengan tenang, tatap mata lawan bicara, lalu segera alihkan topik. Jika mereka terus mendesak, itu tanda kamu perlu meninggalkan situasi tersebut.

## Rencana keluar

Sebelum pergi ke acara yang berisiko, siapkan alasan untuk pulang lebih awal dan pastikan ada transportasi. Beri tahu satu teman tepercaya tentang rencanamu. Simpan nomor bantuan di ponsel.

## Kalau sudah terlanjur

Rasa malu bukan alasan untuk menunda bantuan. Ceritakan pada orang dewasa yang kamu percaya, guru BK, atau layanan konseling. Semakin cepat ditangani, semakin kecil dampaknya.`,
  },
  {
    slug: "hukum-penyalahgunaan-narkoba-di-indonesia",
    title: "Apa Kata Hukum soal Penyalahgunaan Narkoba di Indonesia",
    excerpt:
      "Ringkasan dasar aturan hukum, perbedaan pengguna dan pengedar, serta pentingnya pendampingan hukum.",
    category: "hukum",
    readingMinutes: 7,
    seriesSlug: "keterampilan-bertahan",
    seriesOrder: 2,
    coverImageUrl:
      "https://placehold.co/1200x630/0f766e/ffffff?text=Hukum+Narkoba+Indonesia",
    content: `## Kerangka hukum

Penyalahgunaan narkotika di Indonesia diatur terutama dalam Undang-Undang Nomor 35 Tahun 2009 tentang Narkotika. Aturan ini membedakan perbuatan memiliki, menyimpan, menguasai, menyediakan, memproduksi, dan mengedarkan narkotika, dengan ancaman pidana yang berbeda-beda.

## Pengguna dan pengedar

Pengguna dapat dikenai pidana, tetapi hukum juga membuka jalur rehabilitasi bagi pecandu dan korban penyalahgunaan. Pengedar dan produsen menghadapi ancaman yang jauh lebih berat karena perbuatannya menyebarkan bahaya ke banyak orang.

## Yang perlu diingat

- Tidak ada alasan "cuma coba sekali" yang menghapus tanggung jawab hukum.
- Menyimpan barang milik orang lain tanpa memeriksa isinya bisa berisiko secara hukum.
- Jika kamu atau keluarga menghadapi kasus narkoba, segera cari pendampingan advokat atau lembaga bantuan hukum.

## Bantuan

Layanan Informasi BNN di 184 dapat memberi arahan awal. Untuk bantuan hukum, hubungi lembaga bantuan hukum setempat atau LBH terdekat. Artikel ini bersifat edukatif dan bukan nasihat hukum resmi.`,
  },
  {
    slug: "gejala-awal-kecanduan-dan-cara-mencari-bantuan",
    title: "Gejala Awal Kecanduan dan Cara Mencari Bantuan",
    excerpt:
      "Dari toleransi dosis sampai kehilangan kendali. Kenali tanda-tandanya dan langkah pertama yang bisa diambil.",
    category: "dampak",
    readingMinutes: 6,
    seriesSlug: "pulih-bersama",
    seriesOrder: 1,
    coverImageUrl:
      "https://placehold.co/1200x630/0f766e/ffffff?text=Gejala+Kecanduan",
    content: `## Apa itu kecanduan?

Kecanduan bukan sekadar kurang niat. Ini kondisi kesehatan yang membuat otak mendorong seseorang terus memakai zat meskipun sudah tahu dampaknya. Tanda utamanya adalah hilangnya kendali atas penggunaan.

## Tanda yang sering muncul

- **Toleransi.** Dosis yang dulu cukup kini tidak lagi memberi efek.
- **Gejala putus zat.** Badan gemetar, berkeringat, cemas, atau mual ketika tidak memakai.
- **Kehilangan kendali.** Sudah berjanji berhenti tetapi kembali memakai.
- **Prioritas bergeser.** Zat lebih penting daripada sekolah, keluarga, atau hobi.
- **Tetap memakai meski ada masalah.** Konflik, masalah hukum, atau kesehatan tidak menghentikan penggunaan.

## Langkah pertama

1. Ceritakan kondisi pada satu orang yang dipercaya.
2. Catat pola penggunaan dan gejala yang muncul.
3. Hubungi layanan kesehatan jiwa atau pusat rehabilitasi untuk asesmen awal.
4. Jauhi pemicu dan simpan nomor bantuan.

## Jangan sendirian

Pemulihan bukan proses instan. Dukungan keluarga, konselor, dan komunitas sangat membantu. Hubungi 119 ekstensi 8 untuk layanan kesehatan jiwa, atau Layanan Informasi BNN di 184. Jika terjadi overdosis, segera hubungi 119 atau bawa ke IGD terdekat.`,
  },
  {
    slug: "mitos-dan-fakta-tentang-narkoba",
    title: "Mitos dan Fakta tentang Narkoba",
    excerpt:
      "Beberapa klaim yang sering beredar ternyata menyesatkan. Ini faktanya.",
    category: "umum",
    readingMinutes: 5,
    coverImageUrl:
      "https://placehold.co/1200x630/0f766e/ffffff?text=Mitos+dan+Fakta+Narkoba",
    content: `## Mitos 1: "Cuma sekali, nggak bakal kecanduan"

Fakta: Tidak ada jumlah aman. Sebagian orang menjadi kecanduan setelah penggunaan pertama atau beberapa kali, tergantung jenis zat, dosis, dan kondisi tubuh. Efek buruk seperti serangan panik atau keracunan bisa terjadi sejak awal.

## Mitos 2: "Narkoba bikin kreatif"

Fakta: Stimulan memang membuat orang terjaga, tetapi kualitas kerja justru menurun karena fokus sempit, mudah curiga, dan sulit mengendalikan dorongan. Banyak karya kreatif lahir dari kerja keras dan latihan, bukan dari zat.

## Mitos 3: "Ganja lebih aman dari rokok"

Fakta: Asap ganja juga mengiritasi saluran napas dan mengandung zat yang memengaruhi otak. Pada remaja, ganja berhubungan dengan gangguan memori dan motivasi.

## Mitos 4: "Pecandu cuma perlu disiplin"

Fakta: Kecanduan adalah kondisi kesehatan yang kompleks. Hukuman atau nasihat semata sering tidak cukup. Dibutuhkan asesmen dan pendampingan profesional.

## Mitos 5: "Minta bantuan berarti keluarga dilaporkan"

Fakta: Layanan konsultasi awal diutamakan untuk memberi informasi dan arahan. Kamu bisa bertanya secara anonim melalui kanal resmi BNN atau layanan kesehatan jiwa.

## Kesimpulan

Saring informasi sebelum mempercayainya. Cek sumber resmi seperti BNN, Kementerian Kesehatan, dan tenaga kesehatan terpercaya.`,
  },
];

async function seedArticles(authorId: string): Promise<void> {
  const now = Date.now();

  for (const [index, item] of ARTICLE_SEED.entries()) {
    const [existing] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, item.slug))
      .limit(1);

    if (existing) continue;

    await db.insert(articles).values({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      coverImageUrl: item.coverImageUrl ?? null,
      category: item.category,
      seriesSlug: item.seriesSlug ?? null,
      seriesOrder: item.seriesOrder ?? 0,
      status: "published",
      readingMinutes: item.readingMinutes,
      authorId,
      publishedAt: new Date(now - index * 86_400_000),
    });
  }

  console.log("Artikel siap.");
}

type SeedQuiz = {
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  passScore: number;
  timeLimitSeconds: number;
  questions: Array<{
    prompt: string;
    explanation: string;
    options: Array<{ label: string; isCorrect: boolean }>;
  }>;
};

const QUIZ_SEED: SeedQuiz[] = [
  {
    slug: "mengenal-bahaya-narkoba",
    title: "Mengenal Bahaya Narkoba",
    description:
      "Uji pemahaman dasarmu tentang jenis narkoba, efek pada tubuh, dan cara mencari bantuan.",
    difficulty: "easy",
    passScore: 70,
    timeLimitSeconds: 600,
    questions: [
      {
        prompt: "Narkoba dibedakan menjadi beberapa golongan. Manakah yang termasuk stimulan?",
        explanation:
          "Amfetamin dan metamfetamin (sabu) adalah stimulan yang mempercepat kerja sistem saraf.",
        options: [
          { label: "Heroin", isCorrect: false },
          { label: "Metamfetamin (sabu)", isCorrect: true },
          { label: "Ganja", isCorrect: false },
          { label: "Benzodiazepin", isCorrect: false },
        ],
      },
      {
        prompt: "Apa fungsi utama rehabilitasi bagi pecandu narkoba?",
        explanation:
          "Rehabilitasi membantu pemulihan fisik, psikologis, dan sosial, bukan sekadar menghukum.",
        options: [
          { label: "Menghukum pengguna agar kapok", isCorrect: false },
          { label: "Mengisolasi dari keluarga", isCorrect: false },
          { label: "Memulihkan kondisi fisik, mental, dan sosial secara bertahap", isCorrect: true },
          { label: "Menjual zat pengganti", isCorrect: false },
        ],
      },
      {
        prompt: "Nomor layanan informasi BNN yang dapat dihubungi adalah...",
        explanation: "Layanan Informasi BNN dapat dihubungi di 184.",
        options: [
          { label: "112", isCorrect: false },
          { label: "184", isCorrect: true },
          { label: "110", isCorrect: false },
          { label: "123", isCorrect: false },
        ],
      },
      {
        prompt: "Tanda toleransi pada kecanduan berarti...",
        explanation:
          "Toleransi terjadi ketika tubuh membutuhkan dosis lebih besar untuk mendapat efek yang sama.",
        options: [
          { label: "Tubuh membutuhkan dosis lebih besar untuk efek yang sama", isCorrect: true },
          { label: "Pengguna berhenti memakai zat", isCorrect: false },
          { label: "Zat menjadi lebih murah", isCorrect: false },
          { label: "Pengguna tidur lebih lama", isCorrect: false },
        ],
      },
      {
        prompt: "Jika menemukan teman yang diduga overdosis, langkah paling tepat adalah...",
        explanation:
          "Overdosis adalah keadaan darurat. Segera hubungi 119 atau bawa ke IGD terdekat, jangan menunggu.",
        options: [
          { label: "Menunggu sampai sadar sendiri", isCorrect: false },
          { label: "Memberi minum kopi", isCorrect: false },
          { label: "Menjauh karena takut", isCorrect: false },
          { label: "Segera hubungi 119 atau bawa ke IGD terdekat", isCorrect: true },
        ],
      },
    ],
  },
  {
    slug: "keterampilan-menolak-tawaran",
    title: "Keterampilan Menolak Tawaran",
    description:
      "Latihan memahami tekanan sosial dan memilih respons yang aman ketika ditawari narkoba.",
    difficulty: "medium",
    passScore: 75,
    timeLimitSeconds: 480,
    questions: [
      {
        prompt: "Cara paling aman menghadapi desakan teman yang terus menawarkan narkoba adalah...",
        explanation:
          "Menolak dengan tegas lalu meninggalkan situasi lebih aman daripada terus berdebat di tempat berisiko.",
        options: [
          { label: "Mencoba sekali agar tidak dianggap sombong", isCorrect: false },
          { label: "Menolak tegas dan meninggalkan situasi", isCorrect: true },
          { label: "Menerima tetapi tidak memakai", isCorrect: false },
          { label: "Membeli untuk dibuang", isCorrect: false },
        ],
      },
      {
        prompt: "Mengapa tekanan teman bisa terasa sangat kuat pada remaja?",
        explanation:
          "Kebutuhan diterima kelompok sangat kuat pada masa remaja, sehingga penolakan terasa berisiko sosial.",
        options: [
          { label: "Karena remaja tidak punya pendapat", isCorrect: false },
          { label: "Karena kebutuhan diterima kelompok terasa kuat", isCorrect: true },
          { label: "Karena narkoba selalu gratis", isCorrect: false },
          { label: "Karena hukum melarang menolak", isCorrect: false },
        ],
      },
      {
        prompt: "Sebelum menghadiri acara yang berisiko, sebaiknya...",
        explanation:
          "Rencana keluar dan transportasi yang jelas membuatmu lebih mudah meninggalkan situasi berbahaya.",
        options: [
          { label: "Membawa uang lebih banyak", isCorrect: false },
          { label: "Menyiapkan alasan pulang dan transportasi", isCorrect: true },
          { label: "Memakai zat penenang", isCorrect: false },
          { label: "Pergi sendirian tanpa kabar", isCorrect: false },
        ],
      },
      {
        prompt: "Jika sudah terlanjur memakai narkoba, sikap yang paling tepat adalah...",
        explanation:
          "Menunda bantuan memperbesar risiko. Ceritakan pada orang tepercaya dan cari pendampingan profesional.",
        options: [
          { label: "Menyembunyikan sampai hilang sendiri", isCorrect: false },
          { label: "Menyalahkan diri terus-menerus", isCorrect: false },
          { label: "Segera cerita dan cari bantuan profesional", isCorrect: true },
          { label: "Mencoba zat lain sebagai penawar", isCorrect: false },
        ],
      },
    ],
  },
];

async function seedQuizzes(): Promise<void> {
  for (const quizSeed of QUIZ_SEED) {
    const [existing] = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.slug, quizSeed.slug))
      .limit(1);

    if (existing) continue;

    const [quiz] = await db
      .insert(quizzes)
      .values({
        slug: quizSeed.slug,
        title: quizSeed.title,
        description: quizSeed.description,
        difficulty: quizSeed.difficulty,
        status: "published",
        passScore: quizSeed.passScore,
        timeLimitSeconds: quizSeed.timeLimitSeconds,
      })
      .returning({ id: quizzes.id });

    for (const [index, question] of quizSeed.questions.entries()) {
      const [row] = await db
        .insert(quizQuestions)
        .values({
          quizId: quiz.id,
          prompt: question.prompt,
          explanation: question.explanation,
          position: index,
        })
        .returning({ id: quizQuestions.id });

      await db.insert(quizOptions).values(
        question.options.map((option, optionIndex) => ({
          questionId: row.id,
          label: option.label,
          isCorrect: option.isCorrect,
          position: optionIndex,
        })),
      );
    }
  }

  console.log("Kuis siap.");
}

async function seedBadges(): Promise<void> {
  const rows = [
    {
      code: "pembaca-pertama",
      name: "Pembaca Pertama",
      description: "Menyelesaikan bacaan artikel edukasi pertamamu.",
      icon: "📖",
      points: 10,
      criteria: { type: "articles_read" as const, gte: 1 },
    },
    {
      code: "kutu-buku",
      name: "Kutu Buku",
      description: "Membaca minimal lima artikel edukasi.",
      icon: "📚",
      points: 30,
      criteria: { type: "articles_read" as const, gte: 5 },
    },
    {
      code: "pemula-kuis",
      name: "Pemula Kuis",
      description: "Lulus kuis edukasi pertamamu.",
      icon: "🎯",
      points: 20,
      criteria: { type: "quizzes_passed" as const, gte: 1 },
    },
    {
      code: "jagoan-kuis",
      name: "Jagoan Kuis",
      description: "Lulus lima kuis edukasi.",
      icon: "🏆",
      points: 100,
      criteria: { type: "quizzes_passed" as const, gte: 5 },
    },
    {
      code: "penggerak-diskusi",
      name: "Penggerak Diskusi",
      description: "Komentarmu disetujui dan tampil di artikel.",
      icon: "💬",
      points: 15,
      criteria: { type: "comments" as const, gte: 1 },
    },
    {
      code: "kolektor-poin",
      name: "Kolektor Poin",
      description: "Mengumpulkan 100 poin.",
      icon: "⭐",
      points: 25,
      criteria: { type: "points" as const, gte: 100 },
    },
    {
      code: "legenda-poin",
      name: "Legenda Poin",
      description: "Mengumpulkan 500 poin.",
      icon: "🌟",
      points: 150,
      criteria: { type: "points" as const, gte: 500 },
    },
  ];

  await db.insert(badges).values(rows).onConflictDoNothing({ target: badges.code });
  console.log("Lencana siap.");
}

async function seedContacts(): Promise<void> {
  const [existing] = await db.select({ total: sql<number>`count(*)::int` }).from(helpContacts);
  if ((existing?.total ?? 0) > 0) {
    console.log("Kontak bantuan sudah ada, dilewati.");
    return;
  }

  await db.insert(helpContacts).values([
    {
      name: "Layanan Informasi BNN",
      organization: "Badan Narkotika Nasional",
      category: "bnn",
      phone: "184",
      website: "https://bnn.go.id",
      operatingHours: "24 jam",
      is24h: true,
      position: 1,
    },
    {
      name: "Hotline Kesehatan Jiwa",
      organization: "Kementerian Kesehatan RI",
      category: "hotline",
      phone: "119 ekstensi 8",
      website: "https://kemkes.go.id",
      operatingHours: "24 jam",
      is24h: true,
      position: 2,
    },
    {
      name: "Nomor Darurat Terpadu",
      organization: "Pemerintah Indonesia",
      category: "darurat",
      phone: "112",
      operatingHours: "24 jam",
      is24h: true,
      position: 3,
    },
    {
      name: "Kepolisian",
      organization: "Polri",
      category: "darurat",
      phone: "110",
      operatingHours: "24 jam",
      is24h: true,
      position: 4,
    },
    {
      name: "RSKO Jakarta",
      organization: "Rumah Sakit Ketergantungan Obat",
      category: "rehabilitasi",
      phone: "021-87797597",
      address: "Jl. Lapangan Tembak, Cibubur, Jakarta Timur",
      city: "Jakarta Timur",
      province: "DKI Jakarta",
      website: "https://rsko.co.id",
      operatingHours: "Senin-Sabtu, 08.00-16.00 WIB",
      position: 10,
    },
    {
      name: "RSJ Dr. Soeharto Heerdjan",
      organization: "Rumah Sakit Jiwa Jakarta",
      category: "rehabilitasi",
      phone: "021-5682841",
      address: "Jl. Prof. Dr. Latumenten No. 1, Grogol, Jakarta Barat",
      city: "Jakarta Barat",
      province: "DKI Jakarta",
      operatingHours: "Senin-Jumat, 08.00-16.00 WIB",
      position: 11,
    },
    {
      name: "Balai Rehabilitasi BNN Lido",
      organization: "Badan Narkotika Nasional",
      category: "rehabilitasi",
      phone: "184",
      address: "Jl. Raya Lido, Sukabumi, Jawa Barat",
      city: "Sukabumi",
      province: "Jawa Barat",
      website: "https://bnn.go.id",
      operatingHours: "Senin-Jumat, 08.00-16.00 WIB",
      position: 12,
    },
    {
      name: "RSJ Prof. Dr. Soerojo Magelang",
      organization: "Rumah Sakit Jiwa Soerojo",
      category: "rehabilitasi",
      phone: "0293-363601",
      address: "Jl. Ahmad Yani No. 169, Magelang, Jawa Tengah",
      city: "Magelang",
      province: "Jawa Tengah",
      operatingHours: "Senin-Jumat, 08.00-16.00 WIB",
      position: 13,
    },
    {
      name: "RSJ Menur Surabaya",
      organization: "Rumah Sakit Jiwa Menur",
      category: "rehabilitasi",
      phone: "031-5022036",
      address: "Jl. Raya Menur No. 61, Surabaya, Jawa Timur",
      city: "Surabaya",
      province: "Jawa Timur",
      operatingHours: "Senin-Jumat, 08.00-16.00 WIB",
      position: 14,
    },
  ]);

  console.log("Kontak bantuan siap (data contoh, verifikasi ulang sebelum publikasi).");
}

async function seedGallery(): Promise<void> {
  const [existing] = await db.select({ total: sql<number>`count(*)::int` }).from(mediaAssets);
  if ((existing?.total ?? 0) > 0) {
    console.log("Galeri sudah ada, dilewati.");
    return;
  }

  await db.insert(mediaAssets).values([
    {
      title: "Poster Anti Narkoba: Masa Depan Cerah",
      description: "Poster kampanye sosial untuk remaja. Bebas dipakai untuk kegiatan edukasi.",
      type: "poster",
      url: "https://placehold.co/1200x1600/0f766e/ffffff?text=Masa+Depan+Cerah",
      thumbnailUrl: "https://placehold.co/600x800/0f766e/ffffff?text=Masa+Depan+Cerah",
      tags: ["poster", "remaja", "kampanye"],
    },
    {
      title: "Infografis: Jenis Narkoba dan Efeknya",
      description: "Ringkasan golongan narkoba, bentuk, dan efek jangka pendek.",
      type: "infografis",
      url: "https://placehold.co/1200x1600/134e4a/ffffff?text=Jenis+Narkoba",
      thumbnailUrl: "https://placehold.co/600x800/134e4a/ffffff?text=Jenis+Narkoba",
      tags: ["infografis", "edukasi"],
    },
    {
      title: "Poster: Berani Bilang Tidak",
      description: "Poster untuk mengajak teman menolak tawaran narkoba.",
      type: "poster",
      url: "https://placehold.co/1200x1600/166534/ffffff?text=Berani+Bilang+Tidak",
      thumbnailUrl: "https://placehold.co/600x800/166534/ffffff?text=Berani+Bilang+Tidak",
      tags: ["poster", "pencegahan"],
    },
    {
      title: "Infografis: Langkah Mencari Bantuan",
      description: "Alur sederhana menghubungi layanan bantuan dan rehabilitasi.",
      type: "infografis",
      url: "https://placehold.co/1200x1600/065f46/ffffff?text=Cari+Bantuan",
      thumbnailUrl: "https://placehold.co/600x800/065f46/ffffff?text=Cari+Bantuan",
      tags: ["infografis", "bantuan"],
    },
  ]);

  console.log("Galeri media siap (placeholder).");
}

async function seedSettings(): Promise<void> {
  const settings = [
    {
      key: "heroHeadline",
      value: "Kenali bahayanya, lindungi masa depanmu.",
    },
    {
      key: "heroSubheadline",
      value: "Edukasi anti narkoba yang jujur, mudah dipahami, dan tanpa menghakimi.",
    },
    {
      key: "contactEmail",
      value: "halo@wuod.local",
    },
    {
      key: "footerText",
      value: "Dibuat untuk edukasi pencegahan penyalahgunaan narkoba.",
    },
    {
      key: "certificatesEnabled",
      value: true,
    },
  ];

  for (const setting of settings) {
    await db
      .insert(siteSettings)
      .values(setting)
      .onConflictDoNothing({ target: siteSettings.key });
  }

  console.log("Pengaturan situs siap.");
}

async function main(): Promise<void> {
  console.log("Menyiapkan data awal...");
  const adminId = await seedAdmin();
  await seedArticles(adminId);
  await seedQuizzes();
  await seedBadges();
  await seedContacts();
  await seedGallery();
  await seedSettings();

  console.log("\nSelesai.");
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("Segera ganti kata sandi admin setelah login pertama.");
}

main()
  .then(() => proc?.exit?.(0))
  .catch((error) => {
    console.error("Seed gagal:", error);
    proc?.exit?.(1);
  });
