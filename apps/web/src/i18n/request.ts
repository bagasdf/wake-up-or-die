import { getMessages, type Locale, locales } from "@wuod/i18n";
import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

function safeLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "id";
}

export default getRequestConfig(async ({ locale }) => {
  const h = await headers();
  const c = await cookies();

  const resolved = safeLocale(
    locale ?? h.get("x-next-intl-locale") ?? c.get("NEXT_LOCALE")?.value,
  );

  return {
    locale: resolved,
    messages: getMessages(resolved),
  };
});
