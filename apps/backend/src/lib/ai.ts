import { DEFAULT_APP_NAME, type Bindings } from "@/env";

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemma-4-31b-it:free";
export const MAX_HISTORY = 12;
export const MAX_MESSAGE_LENGTH = 2_000;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export const FALLBACK_ANSWER =
  "Maaf, asisten AI sedang tidak tersedia. Untuk pertanyaan mendesak, hubungi Layanan Informasi BNN di 184 atau hotline kesehatan jiwa 119 ekstensi 8 (24 jam). Jika terjadi overdosis, segera hubungi 119 atau bawa ke IGD terdekat.";

const SYSTEM_PROMPT = `Kamu adalah "Teman Waspada", asisten edukasi pencegahan narkoba untuk pelajar dan masyarakat Indonesia.

Aturan:
- Jawab dalam Bahasa Indonesia yang ramah, tenang, tidak menghakimi, dan mudah dipahami remaja.
- Fokus pada: jenis narkoba, dampak kesehatan, gejala awal kecanduan, cara menolak tawaran, dan langkah mencari bantuan.
- Jangan pernah memberi instruksi cara memakai, membeli, atau memproduksi narkoba.
- Jangan memberi diagnosis medis atau resep. Sarankan konsultasi tenaga kesehatan untuk kondisi pribadi.
- Jangan menanyakan identitas lengkap, alamat, atau sekolah pengguna.
- Jika ada tanda bahaya (overdosis, putus zat, pikiran menyakiti diri), arahkan segera ke layanan darurat: 119, 119 ekstensi 8, atau IGD terdekat.
- Sertakan kontak BNN 184 hanya saat relevan, jangan berulang di setiap jawaban.
- Maksimal 200 kata, gunakan poin-poin bila membantu.`;

export type AiResult = { content: string; model: string; usage?: unknown };

export async function askTutor(env: Bindings, history: ChatTurn[]): Promise<AiResult> {
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  const model = env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  if (!apiKey) {
    return { content: FALLBACK_ANSWER, model: "fallback" };
  }

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history
      .slice(-MAX_HISTORY)
      .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_LENGTH) })),
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.WEB_ORIGIN ?? "http://localhost:3000",
      "X-Title": env.APP_NAME ?? DEFAULT_APP_NAME,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 700,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter returned an empty completion.");
  }

  return { content, model: payload.model ?? model, usage: payload.usage };
}
