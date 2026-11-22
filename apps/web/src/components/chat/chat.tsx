"use client";

import { ChatTeardropText, PaperPlaneRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { apiJson } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const conversationId = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    apiJson<{ conversation: { id: string } }>("/api/chat/conversations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-session-key": sessionKey(),
      },
      body: JSON.stringify({}),
    })
      .then((data) => {
        if (!alive) return;
        conversationId.current = data.conversation.id;
        setMessages([
          { id: nextMessageId(), role: "assistant", content: t("welcome") },
        ]);
        setReady(true);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [t]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every new message
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending || !conversationId.current) return;
    setSending(true);
    setError(false);
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: "user", content },
    ]);
    setInput("");
    apiJson<{ assistantMessage?: { content: string }; message?: { content: string }; content?: string }>(`/api/chat/conversations/${conversationId.current}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-session-key": sessionKey(),
      },
      body: JSON.stringify({ content }),
    })
      .then((data) => {
        const answer =
          data.assistantMessage?.content ??
          data.message?.content ??
          data.content ??
          "";
        setMessages((prev) => [
          ...prev,
          { id: nextMessageId(), role: "assistant", content: answer },
        ]);
      })
      .catch(() => setError(true))
      .finally(() => setSending(false));
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
                  <span
                    className={
                      "inline-block max-w-[85%] rounded-lg px-4 py-3 text-left text-sm leading-6 " +
                      (message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted")
                    }
                  >
                    {message.content}
                  </span>
                </div>
              ))
            )}
            {!ready && !error ? (
              <p className="animate-pulse text-sm text-muted-foreground">…</p>
            ) : null}
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
              disabled={!ready || sending || !input.trim()}
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
