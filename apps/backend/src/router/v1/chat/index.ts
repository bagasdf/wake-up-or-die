import { and, asc, desc, eq, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { chatConversations, chatMessages } from "@/db/schema";
import { FALLBACK_ANSWER, MAX_HISTORY, askTutor } from "@/lib/ai";
import { anonymousKey, created, fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { rateLimit } from "@/lib/rate-limit";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const createConversationSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2_000),
});

const router = createHono()
  .post(
    "/conversations",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Mulai sesi konsultasi baru",
      description:
        "Pengguna login memakai sesi akun; pengunjung anonim harus mengirim header x-session-key agar riwayat dapat diakses kembali.",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Percakapan baru"),
        401: errorResponse("Identitas tidak tersedia"),
      },
    }),
    jsonBody(createConversationSchema),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const sessionKey = anonymousKey(c);
      const body = c.req.valid("json");

      if (!user && !sessionKey) {
        return fail(c, 401, "Masuk atau sertakan header x-session-key untuk memulai konsultasi.");
      }

      const [conversation] = await db
        .insert(chatConversations)
        .values({
          userId: user?.id ?? null,
          sessionKey: user ? null : sessionKey,
          title: body.title ?? "Konsultasi baru",
        })
        .returning();

      return created(c, conversation);
    },
  )

  .get(
    "/conversations",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Daftar percakapan milik saya",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Percakapan terpaginasi beserta pesan terakhir"),
        401: errorResponse("Identitas tidak tersedia"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const sessionKey = anonymousKey(c);
      const page = pagination(c);

      if (!user && !sessionKey) {
        return fail(c, 401, "Masuk atau sertakan header x-session-key.");
      }

      const where = user
        ? eq(chatConversations.userId, user.id)
        : eq(chatConversations.sessionKey, sessionKey as string);

      const [rows, count] = await Promise.all([
        db
          .select({
            id: chatConversations.id,
            title: chatConversations.title,
            createdAt: chatConversations.createdAt,
            updatedAt: chatConversations.updatedAt,
            messageCount: sql<number>`(select count(*)::int from ${chatMessages} where ${chatMessages.conversationId} = ${chatConversations.id})`,
          })
          .from(chatConversations)
          .where(where)
          .orderBy(desc(chatConversations.updatedAt))
          .limit(page.perPage)
          .offset(page.offset),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(chatConversations)
          .where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .get(
    "/conversations/:id/messages",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Riwayat pesan dalam percakapan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Percakapan dan daftar pesan"),
        404: errorResponse("Percakapan tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const sessionKey = anonymousKey(c);
      const id = c.req.param("id");

      if (!user && !sessionKey) {
        return fail(c, 401, "Masuk atau sertakan header x-session-key.");
      }

      const owner = user
        ? eq(chatConversations.userId, user.id)
        : eq(chatConversations.sessionKey, sessionKey as string);

      const [conversation] = await db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.id, id), owner))
        .limit(1);

      if (!conversation) return fail(c, 404, "Percakapan tidak ditemukan.");

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversation.id))
        .orderBy(asc(chatMessages.createdAt));

      return ok(c, { conversation, messages });
    },
  )

  .post(
    "/conversations/:id/messages",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Kirim pesan dan dapatkan jawaban AI",
      description:
        "Meneruskan riwayat percakapan ke OpenRouter. Jika penyedia AI gagal atau belum dikonfigurasi, jawaban fallback berisi kontak bantuan tetap dikirim.",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Pesan pengguna dan jawaban asisten"),
        404: errorResponse("Percakapan tidak ditemukan"),
        429: errorResponse("Terlalu banyak pesan"),
      },
    }),
    jsonBody(sendMessageSchema),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const sessionKey = anonymousKey(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      if (!user && !sessionKey) {
        return fail(c, 401, "Masuk atau sertakan header x-session-key.");
      }

      const limit = rateLimit(
        `chat:${user?.id ?? sessionKey}`,
        20,
        10 * 60 * 1_000,
      );
      if (!limit.ok) {
        c.header("Retry-After", String(limit.retryAfterSeconds));
        return fail(c, 429, "Terlalu banyak pesan. Tunggu sebentar lalu coba lagi.");
      }

      const owner = user
        ? eq(chatConversations.userId, user.id)
        : eq(chatConversations.sessionKey, sessionKey as string);

      const [conversation] = await db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.id, id), owner))
        .limit(1);

      if (!conversation) return fail(c, 404, "Percakapan tidak ditemukan.");

      const [userMessage] = await db
        .insert(chatMessages)
        .values({ conversationId: conversation.id, role: "user", content: body.content })
        .returning();

      const recent = await db
        .select({ role: chatMessages.role, content: chatMessages.content })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversation.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(MAX_HISTORY);

      const history = recent
        .reverse()
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        }));

      let content = FALLBACK_ANSWER;
      let model = "fallback";

      try {
        const answer = await askTutor(c.env, history);
        content = answer.content;
        model = answer.model;
      } catch (error) {
        console.error("chat completion failed", error);
      }

      const [assistantMessage] = await db
        .insert(chatMessages)
        .values({ conversationId: conversation.id, role: "assistant", content, model })
        .returning();

      const title =
        conversation.title === "Konsultasi baru"
          ? body.content.slice(0, 60)
          : conversation.title;

      await db
        .update(chatConversations)
        .set({ title })
        .where(eq(chatConversations.id, conversation.id));

      return created(c, { userMessage, assistantMessage });
    },
  )

  .delete(
    "/conversations/:id",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Hapus percakapan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Percakapan dihapus"),
        404: errorResponse("Percakapan tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const sessionKey = anonymousKey(c);
      const id = c.req.param("id");

      if (!user && !sessionKey) {
        return fail(c, 401, "Masuk atau sertakan header x-session-key.");
      }

      const owner = user
        ? eq(chatConversations.userId, user.id)
        : eq(chatConversations.sessionKey, sessionKey as string);

      const deleted = await db
        .delete(chatConversations)
        .where(and(eq(chatConversations.id, id), owner))
        .returning({ id: chatConversations.id });

      if (deleted.length === 0) return fail(c, 404, "Percakapan tidak ditemukan.");
      return ok(c, { id, deleted: true });
    },
  );

export default router;
