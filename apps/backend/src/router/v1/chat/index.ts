import { and, asc, desc, eq, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { chatConversations, chatMessages } from "@/db/schema";
import { askTutor, askTutorStream, FALLBACK_ANSWER, MAX_HISTORY } from "@/lib/ai";
import { createChatStreamTicket, verifyChatStreamTicket } from "@/lib/chat-stream-ticket";
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

const startStreamSchema = z.object({
  type: z.literal("start"),
  ticket: z.string().min(1).max(2_048),
  content: z.string().trim().min(1).max(2_000),
});

type WorkerWebSocket = WebSocket & { accept(): void };
type WorkerWebSocketPairConstructor = new () => {
  0: WebSocket;
  1: WorkerWebSocket;
};

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
    "/conversations/:id/stream",
    async (c) => {
      const origin = c.req.header("origin");
      const allowedOrigins = new Set([
        c.env.WEB_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ].filter((value): value is string => Boolean(value)));
      if (!origin || !allowedOrigins.has(origin)) {
        return fail(c, 403, "Origin WebSocket tidak diizinkan.");
      }
      if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
        return fail(c, 426, "Endpoint ini memerlukan WebSocket.");
      }

      const WebSocketPair = (globalThis as typeof globalThis & {
        WebSocketPair: WorkerWebSocketPairConstructor;
      }).WebSocketPair;
      const { 0: client, 1: server } = new WebSocketPair();
      server.accept();
      let started = false;
      const startTimeout = setTimeout(() => {
        if (!started) server.close(1008, "Kirim pesan start untuk memulai.");
      }, 5_000);
      const send = (payload: unknown) => {
        if (server.readyState === WebSocket.OPEN) {
          try {
            server.send(JSON.stringify(payload));
          } catch {
            // Client may disconnect during generation.
          }
        }
      };

      server.addEventListener("message", (event: MessageEvent) => {
        if (started || typeof event.data !== "string" || event.data.length > 8_192) {
          send({ type: "error", message: "Pesan WebSocket tidak valid." });
          server.close(1008, "Pesan tidak valid.");
          return;
        }
        started = true;
        clearTimeout(startTimeout);
        void (async () => {
          const parsed = startStreamSchema.safeParse(JSON.parse(event.data));
          if (!parsed.success) {
            send({ type: "error", message: "Permintaan streaming tidak valid." });
            server.close(1008, "Permintaan tidak valid.");
            return;
          }

          const claims = await verifyChatStreamTicket(
            c.env.BETTER_AUTH_SECRET,
            parsed.data.ticket,
          );
          const id = c.req.param("id");
          if (!claims || claims.conversationId !== id) {
            send({ type: "error", message: "Tiket streaming tidak valid atau kedaluwarsa." });
            server.close(1008, "Tiket tidak valid.");
            return;
          }

          const db = c.get("db");
          const owner = claims.userId
            ? eq(chatConversations.userId, claims.userId)
            : eq(chatConversations.sessionKey, claims.sessionKey as string);
          const [conversation] = await db
            .select()
            .from(chatConversations)
            .where(and(eq(chatConversations.id, id), owner))
            .limit(1);
          if (!conversation) {
            send({ type: "error", message: "Percakapan tidak ditemukan." });
            server.close(1008, "Percakapan tidak ditemukan.");
            return;
          }

          const identity = claims.userId ?? claims.sessionKey as string;
          const limit = rateLimit(`chat:${identity}`, 20, 10 * 60 * 1_000);
          if (!limit.ok) {
            send({ type: "error", message: "Terlalu banyak pesan. Tunggu sebentar lalu coba lagi." });
            server.close(1008, "Batas pesan tercapai.");
            return;
          }

          const [userMessage] = await db
            .insert(chatMessages)
            .values({ conversationId: conversation.id, role: "user", content: parsed.data.content })
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
            send({ type: "status", status: "thinking" });
            const answer = await askTutorStream(
              c.env,
              history,
              (delta) => send({ type: "delta", content: delta }),
              () => send({ type: "reset" }),
              (status) => send({ type: "status", status }),
            );
            content = answer.content;
            model = answer.model;
          } catch (error) {
            console.error("chat stream failed", error);
            send({ type: "reset" });
            send({ type: "delta", content: FALLBACK_ANSWER });
          }

          const [assistantMessage] = await db
            .insert(chatMessages)
            .values({ conversationId: conversation.id, role: "assistant", content, model })
            .returning();
          const title = conversation.title === "Konsultasi baru"
            ? parsed.data.content.slice(0, 60)
            : conversation.title;
          await db
            .update(chatConversations)
            .set({ title })
            .where(eq(chatConversations.id, conversation.id));
          send({ type: "done", userMessage, assistantMessage });
          server.close(1000, "Selesai.");
        })().catch((error: unknown) => {
          console.error("chat WebSocket request failed", error);
          send({ type: "error", message: "Gagal mengirim pesan." });
          server.close(1011, "Permintaan gagal.");
        });
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      } as ResponseInit);
    },
  )

  .post(
    "/conversations/:id/stream-ticket",
    describeRoute({
      tags: ["Chatbot"],
      summary: "Buat tiket streaming WebSocket",
      description:
        "Menerbitkan tiket singkat yang terikat ke percakapan dan identitas pemilik. Kirim tiket sebagai pesan awal WebSocket.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Tiket streaming sementara"),
        404: errorResponse("Percakapan tidak ditemukan"),
      },
    }),
    async (c) => {
      const user = c.get("user");
      const sessionKey = anonymousKey(c);
      if (!user && !sessionKey) {
        return fail(c, 401, "Masuk atau sertakan header x-session-key.");
      }

      const owner = user
        ? eq(chatConversations.userId, user.id)
        : eq(chatConversations.sessionKey, sessionKey as string);
      const [conversation] = await c.get("db")
        .select({ id: chatConversations.id })
        .from(chatConversations)
        .where(and(eq(chatConversations.id, c.req.param("id")), owner))
        .limit(1);
      if (!conversation) return fail(c, 404, "Percakapan tidak ditemukan.");

      const expiresAt = Date.now() + 60_000;
      const ticket = await createChatStreamTicket(c.env.BETTER_AUTH_SECRET, {
        conversationId: conversation.id,
        userId: user?.id ?? null,
        sessionKey: user ? null : sessionKey,
        expiresAt,
      });
      return ok(c, { ticket, expiresAt });
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
        "Meneruskan riwayat percakapan ke penyedia AI kompatibel OpenAI. Tool chatbot hanya mengirim GET ke endpoint publik yang diizinkan dan didokumentasikan di Scalar.",
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
