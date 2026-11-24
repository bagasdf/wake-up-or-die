import { asc, eq, sql } from "drizzle-orm";

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
    coverImageUrl: "/static/images/pil.png",
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
    coverImageUrl: "/static/images/teen-brain.png",
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
    coverImageUrl: "/static/images/recovery-support.jpg",
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
    coverImageUrl: "/static/images/poster-1.png",
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
    coverImageUrl: "/static/images/recovery-support.jpg",
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
    coverImageUrl: "/static/images/weed.png",
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

    if (existing) {
      await db
        .update(articles)
        .set({
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          coverImageUrl: item.coverImageUrl ?? null,
          category: item.category,
          seriesSlug: item.seriesSlug ?? null,
          seriesOrder: item.seriesOrder ?? 0,
          status: "published",
          readingMinutes: item.readingMinutes,
        })
        .where(eq(articles.id, existing.id));
      continue;
    }

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

function quizQuestion(
  prompt: string,
  correct: string,
  explanation: string,
  wrongA: string,
  wrongB: string,
): SeedQuiz["questions"][number] {
  return {
    prompt,
    explanation,
    options: [
      { label: correct, isCorrect: true },
      { label: wrongA, isCorrect: false },
      { label: wrongB, isCorrect: false },
    ],
  };
}

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
      quizQuestion("Apa yang dimaksud zat adiktif?", "Zat yang dapat memicu ketergantungan", "Zat adiktif dapat memengaruhi otak dan menimbulkan dorongan untuk terus memakai.", "Zat yang selalu aman", "Vitamin harian"),
      quizQuestion("Apakah tanda perubahan perilaku selalu membuktikan seseorang memakai narkoba?", "Tidak, perlu percakapan dan penilaian yang tepat", "Tanda dapat punya banyak penyebab; jangan langsung menuduh.", "Ya, selalu", "Ya, jika nilainya turun"),
      quizQuestion("Siapa yang tepat untuk menilai masalah kesehatan terkait zat?", "Tenaga kesehatan yang kompeten", "Tenaga kesehatan dapat melakukan asesmen dan memberi rujukan.", "Teman sebaya saja", "Akun anonim di media sosial"),
      quizQuestion("Apa tindakan aman saat seseorang sulit bernapas setelah memakai zat?", "Hubungi layanan darurat dan cari pertolongan medis", "Kesulitan bernapas adalah keadaan darurat medis.", "Suruh berjalan sendirian", "Tunggu sampai besok"),
      quizQuestion("Apa tujuan utama edukasi pencegahan?", "Membantu orang membuat keputusan yang lebih aman", "Edukasi memberi informasi dan keterampilan, bukan menakut-nakuti.", "Mempermalukan orang", "Menggantikan perawatan medis"),
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
      quizQuestion("Respons singkat saat ditawari zat dapat berupa...", "Tidak, aku tidak mau", "Jawaban singkat dan tegas dapat menetapkan batas tanpa perlu berdebat.", "Mungkin nanti", "Berikan dulu kepada orang lain"),
      quizQuestion("Jika ajakan berlanjut setelah kamu menolak, apa langkah aman?", "Pergi dan hubungi orang tepercaya", "Meninggalkan situasi dan meminta dukungan mengurangi paparan tekanan.", "Tetap tinggal agar tidak dianggap berbeda", "Membalas dengan ancaman"),
      quizQuestion("Apa yang sebaiknya disiapkan sebelum acara yang terasa berisiko?", "Transportasi pulang dan kontak teman tepercaya", "Rencana pulang membuat keputusan keluar lebih mudah.", "Janji untuk mencoba sedikit", "Rahasiakan lokasi dari semua orang"),
      quizQuestion("Bagaimana cara membantu teman yang menolak ajakan?", "Dukung keputusannya dan ajak pergi bersama", "Dukungan teman dapat membantu seseorang tetap pada batas aman.", "Ejek agar berubah pikiran", "Tinggalkan tanpa kabar"),
      quizQuestion("Apakah menolak tawaran berarti harus memutus semua pertemanan?", "Tidak, kamu dapat menetapkan batas dan memilih situasi aman", "Batas sehat tidak selalu berarti memutus hubungan.", "Ya, selalu", "Tidak boleh menolak teman"),
      quizQuestion("Jika takut pulang sendiri dari situasi berisiko, lakukan apa?", "Hubungi orang tepercaya untuk menjemput atau menemani", "Minta bantuan agar perjalanan pulang tetap aman.", "Terima tumpangan dari orang asing", "Pergi tanpa memberi tahu siapa pun"),
    ],
  },
  ...[
    {
      slug: "dampak-zat-pada-otak-remaja",
      title: "Dampak Zat pada Otak Remaja",
      description: "Kenali pengaruh zat adiktif pada fokus, memori, suasana hati, dan keputusan.",
      difficulty: "easy",
      prompts: [
        ["Hingga sekitar usia berapa otak masih berkembang?", "Sekitar 25 tahun", "Bagian otak untuk perencanaan dan pengendalian diri berkembang hingga pertengahan usia dua puluhan.", "Sekitar 10 tahun", "Sekitar 40 tahun"],
        ["Salah satu dampak zat adiktif pada proses belajar adalah...", "Gangguan fokus dan memori", "Zat adiktif dapat mengganggu fungsi kognitif yang dibutuhkan untuk belajar.", "Nilai selalu meningkat", "Tidak perlu tidur"],
        ["Dukungan yang membantu pemulihan mencakup...", "Keluarga dan tenaga profesional", "Dukungan profesional dan lingkungan suportif membantu pemulihan.", "Mengucilkan orang tersebut", "Menghentikan semua komunikasi"],
        ["Bagian otak yang terus berkembang membantu seseorang untuk...", "Merencanakan dan mengendalikan dorongan", "Fungsi perencanaan dan pengendalian diri terus berkembang pada masa remaja.", "Mengubah golongan darah", "Menghentikan kebutuhan tidur"],
        ["Penggunaan zat saat otak berkembang dapat mengganggu...", "Memori dan konsentrasi", "Memori dan perhatian penting untuk belajar dan dapat terdampak.", "Tinggi badan secara pasti", "Warna mata"],
        ["Apa respons yang baik jika teman menunjukkan perubahan perilaku?", "Tanyakan kabar dengan empati", "Perubahan perilaku bukan bukti pasti; mulai dengan kepedulian.", "Langsung menuduh", "Sebarkan ke grup"],
        ["Mengapa tidur cukup penting dalam pemulihan?", "Mendukung kesehatan dan fungsi kognitif", "Tidur cukup mendukung kesehatan umum dan konsentrasi.", "Menghapus semua efek secara instan", "Menggantikan bantuan profesional"],
        ["Apakah otak dapat membaik setelah seseorang berhenti memakai zat?", "Fungsi dapat membaik bertahap dengan dukungan", "Pemulihan berbeda pada tiap orang dan bisa membutuhkan bantuan profesional.", "Tidak pernah", "Pasti pulih dalam sehari"],
        ["Kapan keluarga perlu mencari bantuan profesional?", "Saat penggunaan mengganggu hidup atau sulit dihentikan", "Gangguan fungsi dan hilangnya kendali adalah alasan untuk mencari asesmen.", "Hanya setelah ada masalah hukum", "Tidak perlu mencari bantuan"],
        ["Apa yang bukan cara mendukung remaja?", "Mengucilkan dan mempermalukannya", "Stigma dapat menghalangi seseorang mencari pertolongan.", "Mendengarkan", "Menghubungkan dengan tenaga kesehatan"],
      ],
    },
    {
      slug: "mengenali-tanda-kecanduan",
      title: "Mengenali Tanda Kecanduan",
      description: "Pelajari tanda kehilangan kendali dan kapan mencari bantuan profesional.",
      difficulty: "easy",
      prompts: [
        ["Toleransi berarti seseorang...", "Membutuhkan dosis lebih besar untuk efek sama", "Toleransi terjadi ketika tubuh membutuhkan lebih banyak zat untuk efek yang sama.", "Selalu langsung berhenti", "Tidak pernah mengalami efek"],
        ["Manakah tanda kehilangan kendali?", "Kembali memakai meski ingin berhenti", "Terus memakai meski ingin berhenti menunjukkan hilangnya kendali.", "Memilih kegiatan baru", "Bercerita kepada konselor"],
        ["Perubahan perilaku yang mengkhawatirkan sebaiknya ditanggapi dengan...", "Percakapan empatik tanpa menuduh", "Tanda bukan bukti pasti; buka percakapan dan tawarkan bantuan.", "Langsung menuduh", "Menyebarkan kabar"],
        ["Apa yang dimaksud kehilangan kendali?", "Sulit berhenti meski ingin berhenti", "Kesulitan mengendalikan penggunaan meski ada niat untuk berhenti adalah sinyal penting.", "Memilih tidur lebih awal", "Membicarakan masalah"],
        ["Apa arti toleransi terhadap zat?", "Membutuhkan lebih banyak untuk efek yang sama", "Toleransi dapat membuat risiko meningkat.", "Tidak ada efek sama sekali", "Mampu berhenti kapan saja"],
        ["Apa yang dapat muncul saat seseorang berhenti setelah penggunaan berulang?", "Gejala putus zat", "Gejalanya berbeda-beda dan perlu dinilai tenaga kesehatan.", "Kekuatan fisik selalu bertambah", "Tidak ada perubahan"],
        ["Jika teman menunjukkan tanda kecanduan, tindakan awal yang baik adalah...", "Dengarkan dan tawarkan bantuan", "Percakapan tanpa menghakimi dapat membuka jalan ke bantuan.", "Mengancamnya", "Menyebarkan rahasia"],
        ["Siapa yang dapat membantu menilai tanda kecanduan?", "Tenaga kesehatan atau konselor kompeten", "Asesmen profesional membantu menentukan dukungan yang sesuai.", "Orang asing di internet", "Tidak seorang pun"],
        ["Apakah tanda kecanduan sama pada semua orang?", "Tidak, tanda dan dampak dapat berbeda", "Kondisi setiap orang berbeda dan membutuhkan penilaian individual.", "Ya, selalu identik", "Hanya terlihat dari penampilan"],
        ["Apa yang sebaiknya dilakukan jika seseorang mengalami gejala berat?", "Segera cari pertolongan medis", "Gejala berat perlu dinilai dan ditangani tenaga medis.", "Menunggu berminggu-minggu", "Memberi zat lain"],
      ],
    },
    {
      slug: "pertolongan-dan-pemulihan",
      title: "Pertolongan dan Pemulihan",
      description: "Pahami langkah aman saat keadaan darurat dan cara mendukung pemulihan.",
      difficulty: "medium",
      prompts: [
        ["Jika seseorang diduga overdosis, tindakan pertama adalah...", "Hubungi 119 atau segera menuju IGD", "Overdosis adalah keadaan darurat medis yang perlu pertolongan segera.", "Membiarkannya tidur", "Memberi kopi"],
        ["Langkah awal mencari bantuan pemulihan adalah...", "Menghubungi tenaga kesehatan atau layanan bantuan", "Asesmen profesional membantu menentukan dukungan yang sesuai.", "Menyimpan masalah sendirian", "Mengganti dengan zat lain"],
        ["Pemulihan paling tepat dipahami sebagai...", "Proses bertahap dengan dukungan", "Pemulihan dapat melibatkan dukungan medis, keluarga, dan sosial.", "Perubahan instan tanpa dukungan", "Hanya urusan hukuman"],
        ["Jika seseorang tidak responsif dan sulit bernapas, apa prioritasnya?", "Hubungi layanan darurat", "Kesulitan bernapas dan tidak responsif adalah kondisi darurat.", "Rekam video", "Tinggalkan sendirian"],
        ["Apa yang sebaiknya tidak diberikan kepada orang yang diduga overdosis?", "Kopi atau obat tanpa arahan medis", "Jangan memberi zat atau obat tanpa arahan tenaga medis.", "Bantuan darurat", "Informasi yang jelas kepada petugas"],
        ["Siapa yang dapat membantu membuat rencana pemulihan?", "Tenaga kesehatan dan layanan rehabilitasi", "Rencana perlu disesuaikan melalui asesmen profesional.", "Penjual obat ilegal", "Teman yang tidak terlatih saja"],
        ["Bagaimana keluarga dapat mendukung pemulihan?", "Dengarkan, dukung, dan bantu akses layanan", "Dukungan praktis dan bebas stigma dapat membantu seseorang terhubung ke layanan.", "Menghina", "Mengucilkan"],
        ["Apa yang dilakukan saat kondisi darurat medis?", "Ikuti arahan petugas dan menuju IGD", "Petugas medis dapat memberi pertolongan sesuai kondisi.", "Menunda sampai besok", "Mencoba pengobatan sendiri"],
        ["Apakah pemulihan selalu berjalan lurus tanpa hambatan?", "Tidak, proses dapat berbeda dan perlu dukungan", "Kemajuan dapat berbeda bagi tiap orang; bantuan berkelanjutan penting.", "Ya, selalu selesai dalam sehari", "Pemulihan tidak mungkin"],
        ["Apa tujuan asesmen awal?", "Memahami kebutuhan dan menentukan bantuan", "Asesmen membantu memilih langkah yang sesuai dengan kebutuhan seseorang.", "Memberi label tanpa pemeriksaan", "Menggantikan semua tindak lanjut"],
      ],
    },
    {
      slug: "mitos-fakta-narkoba",
      title: "Mitos dan Fakta Narkoba",
      description: "Latih kemampuan memilah klaim populer dari informasi kesehatan tepercaya.",
      difficulty: "easy",
      prompts: [
        ["Apakah mencoba zat sekali pasti aman?", "Tidak, risiko dapat muncul sejak awal", "Keracunan dan dampak serius dapat muncul sejak penggunaan awal.", "Ya, selalu aman", "Aman jika bersama teman"],
        ["Sumber tepat untuk memeriksa informasi kesehatan adalah...", "Lembaga resmi dan tenaga kesehatan", "Utamakan BNN, Kementerian Kesehatan, dan tenaga kesehatan kompeten.", "Unggahan anonim", "Pesan berantai tanpa sumber"],
        ["Kecanduan sebaiknya dipahami sebagai...", "Kondisi kesehatan yang perlu dukungan", "Kecanduan kompleks dan dapat memerlukan asesmen serta pendampingan.", "Sekadar kurang disiplin", "Masalah yang selalu selesai sendiri"],
        ["Apakah semua orang pasti kecanduan setelah satu kali memakai?", "Tidak bisa dipastikan, tetapi risiko dapat muncul sejak awal", "Risiko berbeda-beda dan dampak serius dapat terjadi sejak awal.", "Tidak ada risiko sama sekali", "Ya, pasti pada semua orang"],
        ["Apa respons tepat terhadap klaim kesehatan tanpa sumber?", "Periksa ke sumber resmi atau tenaga kesehatan", "Informasi kesehatan sebaiknya diperiksa melalui sumber tepercaya.", "Sebarkan segera", "Anggap benar jika viral"],
        ["Apakah zat dapat meningkatkan kreativitas dengan aman?", "Tidak ada bukti yang membuat penggunaan tanpa pengawasan menjadi aman", "Efek zat dapat mengganggu fokus dan membawa risiko kesehatan.", "Ya, selalu", "Aman jika digunakan saat belajar"],
        ["Apakah kecanduan cukup ditangani dengan hukuman?", "Tidak, asesmen dan dukungan kesehatan dapat diperlukan", "Kecanduan adalah kondisi kompleks yang tidak selalu selesai dengan hukuman.", "Ya, hukuman selalu menyembuhkan", "Tidak perlu bantuan apa pun"],
        ["Apa ciri informasi kesehatan yang dapat dipercaya?", "Sumber jelas dan dapat diverifikasi", "Periksa sumber, bukti, dan tanggal informasi.", "Tidak mencantumkan sumber", "Meminta dibagikan berantai"],
        ["Apakah konsultasi awal berarti seseorang langsung dihukum?", "Tidak, konsultasi membantu mendapat informasi dan arahan", "Hubungi layanan resmi untuk memahami proses dan pilihan bantuan.", "Ya, selalu", "Konsultasi tidak pernah tersedia"],
        ["Apa yang dilakukan jika informasi bertentangan?", "Tanyakan kepada tenaga kesehatan atau sumber resmi", "Sumber kompeten dapat membantu menilai klaim kesehatan.", "Pilih yang paling menakutkan", "Ikuti komentar anonim"],
      ],
    },
    {
      slug: "memahami-golongan-zat",
      title: "Memahami Golongan Zat",
      description: "Kenali perbedaan umum depresan, stimulan, dan halusinogen serta risikonya.",
      difficulty: "medium",
      prompts: [
        ["Stimulan umumnya...", "Meningkatkan aktivitas sistem saraf", "Stimulan dapat meningkatkan aktivitas tubuh dan memicu gelisah atau jantung berdebar.", "Memperlambat sistem saraf", "Tidak memengaruhi tubuh"],
        ["Depresan dapat berbahaya karena berpotensi...", "Menekan pernapasan", "Depresan dapat menekan pernapasan, terutama tanpa pengawasan medis.", "Meningkatkan kemampuan mengambil keputusan", "Mencegah semua risiko kesehatan"],
        ["Halusinogen dapat mengubah...", "Persepsi", "Halusinogen dapat mengubah persepsi seseorang terhadap lingkungan.", "Golongan darah", "Sidik jari"],
        ["Apa risiko utama depresan tanpa pengawasan medis?", "Gangguan kesadaran dan pernapasan", "Depresan dapat menekan sistem saraf dan pernapasan.", "Meningkatkan konsentrasi secara pasti", "Mencegah ketergantungan"],
        ["Metamfetamin termasuk kelompok...", "Stimulan", "Metamfetamin adalah stimulan yang dapat meningkatkan aktivitas sistem saraf.", "Depresan", "Antibiotik"],
        ["Mengapa klasifikasi zat bukan panduan untuk mencoba?", "Setiap zat tetap memiliki risiko dan perlu pengawasan medis", "Informasi klasifikasi untuk edukasi, bukan panduan penggunaan.", "Karena semua zat aman", "Agar bisa mencampur zat"],
        ["Zat halusinogen dapat memengaruhi...", "Cara seseorang merasakan dan menafsirkan lingkungan", "Perubahan persepsi dapat memengaruhi keselamatan dan keputusan.", "Golongan darah", "Sidik jari"],
        ["Apa respons aman jika seseorang mengalami reaksi buruk setelah memakai zat?", "Cari pertolongan medis", "Reaksi berat perlu mendapat penilaian medis segera.", "Beri dosis tambahan", "Biarkan sendirian"],
        ["Apakah zat dengan nama berbeda pasti punya efek yang sama?", "Tidak, kandungan dan dampak dapat berbeda", "Kandungan zat dapat berubah dan sulit dipastikan tanpa pemeriksaan.", "Ya, semua identik", "Ya, jika warnanya sama"],
        ["Apa sumber paling tepat untuk informasi medis tentang zat?", "Tenaga kesehatan dan lembaga resmi", "Informasi profesional lebih dapat diandalkan daripada rumor.", "Pesan berantai", "Iklan tanpa sumber"],
      ],
    },
    {
      slug: "dukungan-teman-dan-keluarga",
      title: "Dukungan untuk Teman dan Keluarga",
      description: "Dampingi seseorang tanpa menghakimi dan tetap utamakan keselamatan.",
      difficulty: "medium",
      prompts: [
        ["Pembuka percakapan yang baik saat khawatir pada teman adalah...", "Aku peduli dan siap mendengarkan", "Ungkapkan kepedulian dan dengarkan tanpa langsung menuduh.", "Kamu pasti pengguna", "Aku akan menyebarkan ini"],
        ["Jika teman membutuhkan bantuan di luar kemampuan kita...", "Arahkan ke bantuan profesional", "Libatkan orang dewasa tepercaya atau tenaga profesional.", "Berpura-pura menjadi dokter", "Putuskan semua dukungan"],
        ["Jika ada bahaya langsung, prioritas utama adalah...", "Jaga keselamatan dan minta bantuan darurat", "Keselamatan segera menjadi prioritas.", "Merekam untuk dibagikan", "Menunggu tanpa memberi tahu siapa pun"],
        ["Kalimat yang menunjukkan empati adalah...", "Aku peduli dan ingin mendengarkan", "Empati menyatakan kepedulian tanpa memberi label atau menuduh.", "Kamu selalu bikin masalah", "Aku akan ceritakan ke semua orang"],
        ["Jika teman belum siap bercerita, apa yang dapat dilakukan?", "Hormati batasnya dan tetap tawarkan dukungan", "Jangan memaksa; beri tahu bahwa bantuan tersedia saat ia siap.", "Paksa menjawab", "Sebarkan dugaan"],
        ["Kapan perlu melibatkan orang dewasa tepercaya?", "Saat keselamatan atau kesehatan teman terancam", "Orang dewasa atau profesional dapat membantu saat masalah melampaui kemampuan teman.", "Tidak pernah", "Hanya untuk menghukum"],
        ["Apa contoh dukungan praktis?", "Menemani mencari layanan profesional", "Bantuan praktis dapat memudahkan akses ke dukungan yang tepat.", "Mengambil alih semua keputusan", "Menyimpan keadaan darurat sebagai rahasia"],
        ["Bagaimana menjaga privasi teman?", "Bagikan informasi hanya kepada pihak yang perlu membantu", "Jaga privasi kecuali keselamatan memerlukan bantuan dari pihak tepercaya.", "Unggah ke media sosial", "Kirim ke semua grup"],
        ["Apa yang dilakukan jika teman menyebut ingin menyakiti diri?", "Dampingi dan segera hubungi bantuan darurat atau profesional", "Ancaman keselamatan perlu dukungan segera dan tidak boleh ditangani sendirian.", "Abaikan", "Janji untuk merahasiakan tanpa bantuan"],
        ["Apakah teman sebaya dapat menggantikan tenaga profesional?", "Tidak, teman dapat mendukung dan membantu menghubungkan ke layanan", "Teman memberi dukungan, tetapi asesmen dan perawatan perlu tenaga kompeten.", "Ya, selalu", "Ya, tanpa pelatihan"],
      ],
    },
    {
      slug: "hukum-dan-akses-bantuan",
      title: "Hukum dan Akses Bantuan",
      description: "Pahami batas informasi umum dan kapan mencari pendampingan hukum.",
      difficulty: "hard",
      prompts: [
        ["Artikel edukasi hukum sebaiknya diperlakukan sebagai...", "Informasi umum, bukan nasihat hukum resmi", "Informasi umum tidak menggantikan konsultasi advokat atau lembaga bantuan hukum.", "Nasihat resmi untuk semua perkara", "Pengganti pendampingan hukum"],
        ["Saat menghadapi perkara hukum, langkah tepat adalah...", "Cari pendampingan hukum kompeten", "Advokat atau lembaga bantuan hukum dapat memberi arahan sesuai perkara.", "Mengandalkan kabar media sosial", "Menghapus semua bukti"],
        ["Mengapa konteks dan perbuatan penting dalam informasi hukum?", "Aturan dan konsekuensi bergantung pada fakta", "Perbuatan dan konteks berbeda dapat memiliki konsekuensi hukum berbeda.", "Semua kasus dianggap sama", "Agar tidak perlu mencari bantuan"],
        ["Apa langkah awal jika menerima pertanyaan hukum yang serius?", "Konsultasikan dengan advokat atau lembaga bantuan hukum", "Pendamping yang kompeten dapat menilai fakta dan pilihan hukum.", "Ikuti komentar anonim", "Hapus semua pesan"],
        ["Apakah artikel umum dapat menggantikan nasihat untuk kasus tertentu?", "Tidak, fakta tiap perkara perlu dinilai", "Artikel edukatif tidak menggantikan nasihat hukum yang mempertimbangkan keadaan konkret.", "Ya, selalu", "Ya, jika artikel populer"],
        ["Apa yang perlu dilakukan sebelum membagikan informasi hukum?", "Periksa sumber dan konteksnya", "Aturan dan penerapan hukum harus dipahami dalam konteks serta sumber resmi.", "Percaya judul saja", "Ubah isinya agar viral"],
        ["Jika seseorang membutuhkan bantuan kesehatan terkait narkoba, prioritasnya...", "Akses layanan kesehatan dan informasi bantuan resmi", "Kesehatan dan keselamatan perlu ditangani melalui layanan yang kompeten.", "Menghindari semua layanan", "Mengandalkan rumor"],
        ["Apa arti rehabilitasi dalam konteks dukungan?", "Layanan pemulihan yang dinilai sesuai kebutuhan", "Jenis layanan dan kelayakannya perlu dikonsultasikan ke pihak berwenang.", "Hukuman yang sama untuk semua orang", "Jaminan hasil instan"],
        ["Apa yang sebaiknya tidak dilakukan saat keluarga menghadapi perkara hukum?", "Mengambil keputusan hanya dari kabar yang belum terverifikasi", "Periksa sumber dan dapatkan pendampingan yang kompeten.", "Mencari advokat", "Menyimpan dokumen relevan dengan aman"],
        ["Ke mana mencari informasi resmi tentang layanan BNN?", "Kanal resmi BNN", "Gunakan kanal resmi untuk informasi terbaru dan arahan layanan.", "Akun anonim", "Pesan berantai"],
      ],
    },
    {
      slug: "membangun-kebiasaan-sehat",
      title: "Membangun Kebiasaan Sehat",
      description: "Temukan kebiasaan dan dukungan sosial yang membantu menjaga kesehatan.",
      difficulty: "easy",
      prompts: [
        ["Kebiasaan yang mendukung kesehatan tubuh adalah...", "Tidur cukup dan olahraga teratur", "Tidur dan aktivitas fisik teratur mendukung kesehatan secara umum.", "Menghindari semua teman", "Mengganti tidur dengan minuman energi"],
        ["Saat merasa tertekan, pilihan sehat adalah...", "Bercerita pada orang tepercaya atau konselor", "Meminta dukungan membuka akses pada cara menghadapi tekanan yang aman.", "Memendam semuanya", "Menggunakan zat untuk mengatasi perasaan"],
        ["Ketahanan diri dapat diperkuat dengan...", "Dukungan sosial dan keterampilan menghadapi tekanan", "Dukungan sosial dan batasan sehat membantu menghadapi tekanan.", "Menolak semua bantuan", "Mengambil risiko agar diterima"],
        ["Kebiasaan apa yang membantu mengelola stres?", "Aktivitas fisik, istirahat, dan berbicara dengan orang tepercaya", "Rutinitas sehat dan dukungan dapat membantu mengelola stres.", "Mengisolasi diri terus-menerus", "Menggunakan zat"],
        ["Apa contoh batasan sehat dalam pertemanan?", "Berani berkata tidak pada ajakan yang berisiko", "Batasan membantu menjaga keselamatan dan nilai pribadi.", "Selalu mengikuti tekanan", "Menerima semua permintaan"],
        ["Saat merasa kewalahan, tindakan yang membantu adalah...", "Memecah masalah dan meminta dukungan", "Langkah kecil dan bantuan orang tepercaya membuat masalah lebih mudah dihadapi.", "Memendam semuanya", "Menghindari tidur"],
        ["Mengapa aktivitas yang disukai bisa membantu?", "Memberi kegiatan positif dan rasa terhubung", "Hobi sehat dapat mendukung kesejahteraan dan hubungan sosial.", "Menggantikan semua layanan kesehatan", "Menghapus masalah seketika"],
        ["Apa cara menjaga pertemanan tetap aman?", "Pilih lingkungan yang menghormati batas", "Lingkungan suportif membantu seseorang membuat pilihan yang aman.", "Ikuti semua ajakan", "Rahasiakan bahaya"],
        ["Jika kebiasaan sehat belum cukup mengatasi tekanan, apa langkah berikut?", "Cari bantuan konselor atau tenaga kesehatan", "Bantuan profesional tersedia ketika strategi mandiri belum cukup.", "Menyalahkan diri", "Mencoba zat"],
        ["Apakah satu rutinitas sehat dapat menjamin semua masalah selesai?", "Tidak, kesehatan dipengaruhi banyak faktor", "Kebiasaan mendukung kesehatan tetapi bukan jaminan atau pengganti perawatan.", "Ya, selalu", "Ya, tanpa dukungan"],
      ],
    },
  ].map((item) => ({
    slug: item.slug,
    title: item.title,
    description: item.description,
    difficulty: item.difficulty as SeedQuiz["difficulty"],
    passScore: 70,
    timeLimitSeconds: 420,
    questions: item.prompts.map(([prompt, correct, explanation, wrongA, wrongB]) =>
      quizQuestion(prompt, correct, explanation, wrongA, wrongB),
    ),
  })),
];

async function seedQuizzes(): Promise<void> {
  for (const quizSeed of QUIZ_SEED) {
    const [existing] = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.slug, quizSeed.slug))
      .limit(1);

    const quizId = existing?.id ??
      (
        await db
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
          .returning({ id: quizzes.id })
      )[0]?.id;

    if (!quizId) throw new Error(`Gagal membuat kuis: ${quizSeed.slug}`);

    const existingQuestions = await db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.position));

    for (const [index, question] of quizSeed.questions
      .slice(existingQuestions.length)
      .entries()) {
      const [row] = await db
        .insert(quizQuestions)
        .values({
          quizId,
          prompt: question.prompt,
          explanation: question.explanation,
          position: existingQuestions.length + index,
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
  if (env.SEED_QUIZZES_ONLY === "true") {
    console.log("Menyiapkan kuis saja...");
    await seedQuizzes();
    console.log("Kuis siap.");
    return;
  }

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
