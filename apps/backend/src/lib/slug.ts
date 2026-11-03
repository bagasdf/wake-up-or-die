export function slugify(value: string, maxLength = 80): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "untitled";
}

export function uniqueSlug(value: string): string {
  return `${slugify(value)}-${crypto.randomUUID().slice(0, 6)}`;
}
