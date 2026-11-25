"use client";

import {
  ChatTeardropText,
  CircleNotch,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { createMarkdownRenderer } from "fumadocs-core/content/md";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import remarkGfm from "remark-gfm";
import { apiJson } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";

declare const __CHAT_WS_BASE__: string;

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  status?: "thinking" | "searching";
};

function MarkdownLink({ href, children, ...props }: ComponentProps<"a">) {
  if (!href) return <>{children}</>;

  const target = href.trim();
  const external = /^(https?:)?\/\//i.test(target);
  const safe =
    external || /^(mailto|tel):/i.test(target) || /^(\/|#|\?)/.test(target);
  if (!safe) return <>{children}</>;

  return (
    <a
      {...props}
      href={target}
      className="break-words font-medium text-primary underline underline-offset-4"
      target={external ? "_blank" : props.target}
      rel={external ? "noreferrer noopener" : props.rel}
    >
      {children}
    </a>
  );
}

function MarkdownTable({ children, ...props }: ComponentProps<"table">) {
  return (
    <div className="my-4 max-w-full overflow-x-auto">
      <table
        {...props}
        className="w-full min-w-max border-collapse text-left text-xs sm:text-sm"
      >
        {children}
      </table>
    </div>
  );
}

function MarkdownTableHeader({ children, ...props }: ComponentProps<"th">) {
  return (
    <th
      {...props}
      className="border-b border-border bg-background/70 px-3 py-2 font-semibold"
    >
      {children}
    </th>
  );
}

function MarkdownTableCell({ children, ...props }: ComponentProps<"td">) {
  return (
    <td {...props} className="border-b border-border/70 px-3 py-2 align-top">
      {children}
    </td>
  );
}

const { Markdown } = createMarkdownRenderer({ remarkPlugins: [remarkGfm] });
const markdownComponents = {
  a: MarkdownLink,
  table: MarkdownTable,
  th: MarkdownTableHeader,
  td: MarkdownTableCell,
};

let messageId = 0;

function nextMessageId() {
  return ++messageId;
}

const SESSION_KEY = "wuod-session-key";

function sessionKey() {
  let key = window.localStorage.getItem(SESSION_KEY);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, key);
  }
  return key;
}

export function Chat() {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: nextMessageId(), role: "assistant", content: t("welcome") },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const conversationId = useRef<string | null>(null);
  const conversationPromise = useRef<Promise<string> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every new message
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const getConversationId = () => {
    if (conversationId.current) return Promise.resolve(conversationId.current);
    if (!conversationPromise.current) {
      conversationPromise.current = apiJson<{ id: string }>(
        "/api/chat/conversations",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-session-key": sessionKey(),
          },
          body: JSON.stringify({}),
        },
      )
        .then((data) => {
          conversationId.current = data.id;
          return data.id;
        })
        .catch((error: unknown) => {
          conversationPromise.current = null;
          throw error;
        });
    }
    return conversationPromise.current;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setError(false);
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: "user", content },
    ]);
    const answerId = nextMessageId();
    setMessages((prev) => [
      ...prev,
      { id: answerId, role: "assistant", content: "", status: "thinking" },
    ]);
    setInput("");
    try {
      const id = await getConversationId();
      const { ticket } = await apiJson<{ ticket: string }>(
        `/api/chat/conversations/${id}/stream-ticket`,
        {
          method: "POST",
          headers: {
            "x-session-key": sessionKey(),
          },
        },
      );
      await new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(
          `${__CHAT_WS_BASE__}/api/v1/chat/conversations/${encodeURIComponent(id)}/stream`,
        );
        let finished = false;
        const timeout = setTimeout(() => {
          fail();
          socket.close();
        }, 180_000);
        const fail = () => {
          if (finished) return;
          finished = true;
          clearTimeout(timeout);
          reject(new Error("Chat stream failed."));
        };

        socket.onopen = () => {
          if (finished) {
            socket.close();
            return;
          }
          socket.send(JSON.stringify({ type: "start", ticket, content }));
        };
        socket.onmessage = (event) => {
          let data: {
            type?: string;
            status?: "thinking" | "searching";
            content?: string;
            message?: string;
            assistantMessage?: { content: string };
          };
          try {
            data = JSON.parse(String(event.data));
          } catch {
            fail();
            return;
          }

          if (data.type === "status" && data.status) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === answerId
                  ? { ...message, status: data.status }
                  : message,
              ),
            );
          } else if (data.type === "delta" && data.content) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === answerId
                  ? {
                      ...message,
                      content: message.content + data.content,
                      status: undefined,
                    }
                  : message,
              ),
            );
          } else if (data.type === "reset") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === answerId ? { ...message, content: "" } : message,
              ),
            );
          } else if (data.type === "done") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === answerId
                  ? {
                      ...message,
                      content:
                        data.assistantMessage?.content ?? message.content,
                      status: undefined,
                    }
                  : message,
              ),
            );
            finished = true;
            clearTimeout(timeout);
            resolve();
            socket.close();
          } else if (data.type === "error") {
            fail();
            socket.close();
          }
        };
        socket.onerror = fail;
        socket.onclose = () => {
          if (!finished) fail();
        };
      });
    } catch {
      setMessages((prev) => prev.filter((message) => message.id !== answerId));
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
      <header className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1fr_280px] md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Konsultasi awal</p>
          <h1 className="mt-3 font-heading text-5xl font-medium tracking-tight md:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-[55ch] text-sm leading-7 text-muted-foreground">
            Ajukan pertanyaan umum tentang narkoba, gejala, atau langkah awal
            meminta bantuan.
          </p>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <ChatTeardropText
            size={24}
            className="text-primary"
            weight="duotone"
          />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Percakapan anonim. Untuk keadaan darurat, hubungi layanan setempat
            segera.
          </p>
        </div>
      </header>

      <div className="mt-8 grid max-w-[880px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div
            ref={listRef}
            className="min-h-[420px] max-h-[50dvh] space-y-3 overflow-y-auto p-5 md:p-6"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? "text-right" : ""}
                >
                  <div
                    className={
                      "inline-block max-w-[85%] rounded-lg px-4 py-3 text-left text-sm leading-6 " +
                      (message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted")
                    }
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-foreground">
                        {message.content ? (
                          <Markdown components={markdownComponents}>
                            {message.content}
                          </Markdown>
                        ) : null}
                        {message.status ? (
                          <output className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <CircleNotch
                              className="size-3.5 animate-spin motion-reduce:animate-none"
                              aria-hidden="true"
                            />
                            {t(message.status)}
                          </output>
                        ) : null}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={submit}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
            >
              <PaperPlaneRight className="size-4" weight="bold" /> {t("send")}
            </button>
          </form>
        </div>
        <p className="mt-3 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          <ChatTeardropText className="size-3.5" weight="duotone" />{" "}
          {t("disclaimer")}
        </p>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {t("error")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
