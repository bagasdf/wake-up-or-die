import type { Locale } from "./routing";

import en from "./messages/en.json";
import id from "./messages/id.json";

export type Messages = typeof id;

const messages: Record<Locale, Messages> = { id, en };

export function getMessages(locale: string): Messages {
  return messages[locale as Locale] ?? messages.id;
}

export { routing, locales, defaultLocale } from "./routing";
export type { Locale } from "./routing";
