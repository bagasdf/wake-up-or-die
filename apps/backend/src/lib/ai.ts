import { type Bindings, DEFAULT_APP_NAME } from "@/env";
import {
  executeTutorTool,
  type ToolCall,
  TUTOR_SYSTEM_PROMPT,
  TUTOR_TOOLS,
} from "@/lib/prompt";

export const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_MODEL = "google/gemma-4-31b-it:free";
export const MAX_HISTORY = 12;
export const MAX_MESSAGE_LENGTH = 2_000;
const MAX_TOOL_ROUNDS = 3;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export const FALLBACK_ANSWER =
  "Maaf, asisten AI sedang tidak tersedia. Untuk pertanyaan mendesak, hubungi Layanan Informasi BNN di 184 atau hotline kesehatan jiwa 119 ekstensi 8 (24 jam). Jika terjadi overdosis, segera hubungi 119 atau bawa ke IGD terdekat.";

export type AiResult = { content: string; model: string; usage?: unknown };

export async function askTutor(env: Bindings, history: ChatTurn[]): Promise<AiResult> {
  const apiKey = env.OPENAI_COMPATIBLE_API_KEY?.trim();
  const model = env.OPENAI_COMPATIBLE_MODEL?.trim() || DEFAULT_MODEL;
  const baseUrl = env.OPENAI_COMPATIBLE_BASE_URL?.trim() || DEFAULT_OPENAI_COMPATIBLE_BASE_URL;

  if (!apiKey) {
    return { content: FALLBACK_ANSWER, model: "fallback" };
  }

  const messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
  }> = [
    { role: "system", content: TUTOR_SYSTEM_PROMPT },
    ...history
      .slice(-MAX_HISTORY)
      .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_LENGTH) })),
  ];

  let latestModel = model;
  let usage: unknown;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
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
        tools: TUTOR_TOOLS,
        tool_choice: "auto",
        temperature: 0.4,
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AI provider ${response.status}: ${detail.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      model?: string;
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: ToolCall[];
        };
      }>;
      usage?: unknown;
    };
    latestModel = payload.model ?? model;
    usage = payload.usage;

    const message = payload.choices?.[0]?.message;
    const toolCalls = message?.tool_calls ?? [];
    if (toolCalls.length === 0) {
      const content = message?.content?.trim();
      if (!content) throw new Error("AI provider returned an empty completion.");
      return { content, model: latestModel, usage };
    }

    if (round === MAX_TOOL_ROUNDS) {
      throw new Error("AI provider exceeded the tool-call limit.");
    }

    messages.push({
      role: "assistant",
      content: message?.content ?? null,
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      const result = await executeTutorTool(
        env.CHAT_API_ORIGIN,
        toolCall.function.name,
        toolCall.function.arguments,
      );
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error("AI provider tool loop ended unexpectedly.");
}

export async function askTutorStream(
  env: Bindings,
  history: ChatTurn[],
  onDelta: (delta: string) => void,
  onReset: () => void,
  onStatus: (status: "thinking" | "searching") => void,
): Promise<AiResult> {
  const apiKey = env.OPENAI_COMPATIBLE_API_KEY?.trim();
  const model = env.OPENAI_COMPATIBLE_MODEL?.trim() || DEFAULT_MODEL;
  const baseUrl = env.OPENAI_COMPATIBLE_BASE_URL?.trim() || DEFAULT_OPENAI_COMPATIBLE_BASE_URL;

  if (!apiKey) {
    onDelta(FALLBACK_ANSWER);
    return { content: FALLBACK_ANSWER, model: "fallback" };
  }

  const messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
  }> = [
    { role: "system", content: TUTOR_SYSTEM_PROMPT },
    ...history
      .slice(-MAX_HISTORY)
      .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_LENGTH) })),
  ];

  let latestModel = model;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    onStatus("thinking");
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
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
        tools: TUTOR_TOOLS,
        tool_choice: "auto",
        temperature: 0.4,
        max_tokens: 700,
        stream: true,
      }),
      signal: AbortSignal.timeout(40_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AI provider ${response.status}: ${detail.slice(0, 300)}`);
    }
    if (!response.body) throw new Error("AI provider returned no stream.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const toolCalls = new Map<number, ToolCall>();
    let content = "";
    let buffer = "";
    let streamDone = false;

    const processEvent = (event: string) => {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (!data || data === "[DONE]") return;

      const payload = JSON.parse(data) as {
        model?: string;
        choices?: Array<{
          delta?: {
            content?: string | null;
            tool_calls?: Array<{
              index?: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }>;
          };
        }>;
      };
      latestModel = payload.model ?? latestModel;
      const delta = payload.choices?.[0]?.delta;
      if (delta?.content) {
        content += delta.content;
        onDelta(delta.content);
      }
      for (const partial of delta?.tool_calls ?? []) {
        const index = partial.index ?? 0;
        const call = toolCalls.get(index) ?? {
          id: "",
          type: "function" as const,
          function: { name: "", arguments: "" },
        };
        call.id ||= partial.id ?? "";
        call.function.name += partial.function?.name ?? "";
        call.function.arguments += partial.function?.arguments ?? "";
        toolCalls.set(index, call);
      }
    };

    try {
      while (!streamDone) {
        const { value, done } = await reader.read();
        streamDone = done;
        buffer += decoder.decode(value, { stream: !done });
        let separator = buffer.match(/\r?\n\r?\n/);
        while (separator?.index !== undefined) {
          processEvent(buffer.slice(0, separator.index));
          buffer = buffer.slice(separator.index + separator[0].length);
          separator = buffer.match(/\r?\n\r?\n/);
        }
      }
      if (buffer.trim()) processEvent(buffer);
    } finally {
      reader.releaseLock();
    }

    const calls = [...toolCalls.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, call]) => call);
    if (calls.length === 0) {
      if (!content.trim()) throw new Error("AI provider returned an empty completion.");
      return { content: content.trim(), model: latestModel };
    }
    if (round === MAX_TOOL_ROUNDS) throw new Error("AI provider exceeded the tool-call limit.");

    onReset();
    messages.push({ role: "assistant", content: content || null, tool_calls: calls });
    for (const toolCall of calls) {
      onStatus("searching");
      const result = await executeTutorTool(
        env.CHAT_API_ORIGIN,
        toolCall.function.name,
        toolCall.function.arguments,
      );
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error("AI provider tool loop ended unexpectedly.");
}
