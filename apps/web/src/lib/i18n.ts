import id from "../../../../packages/i18n/src/messages/id.json";

function lookup(messages: unknown, key: string): string {
  const value = key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  return typeof value === "string" ? value : key;
}

export function useTranslations(namespace?: string) {
  return (key: string, values?: Record<string, string | number>) => {
    let text = lookup(id, namespace ? `${namespace}.${key}` : key);
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

export function useLocale() {
  return "id";
}
