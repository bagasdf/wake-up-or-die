export type CertificateInput = {
  title: string;
  recipientName: string;
  code: string;
  issuedAt: Date;
  appName: string;
  description?: string;
};

export function newCertificateCode(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `WUOD-${year}-${random}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/**
 * Vector certificate served with `image/svg+xml`. SVG keeps the Worker bundle
 * small (no PDF/Canvas binary) and still prints or converts to PDF client side.
 */
export function renderCertificateSvg(input: CertificateInput): string {
  const name = escapeXml(input.recipientName);
  const title = escapeXml(input.title);
  const appName = escapeXml(input.appName);
  const description = escapeXml(
    input.description ?? "atas partisipasi dan pemahaman materi edukasi bahaya narkoba",
  );
  const code = escapeXml(input.code);
  const issued = escapeXml(formatDate(input.issuedAt));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="794" viewBox="0 0 1123 794" role="img" aria-label="Sertifikat ${title}">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>
  <rect width="1123" height="794" fill="#ffffff"/>
  <rect x="0" y="0" width="1123" height="16" fill="url(#accent)"/>
  <rect x="48" y="56" width="1027" height="682" fill="none" stroke="#0f766e" stroke-width="2" rx="12"/>
  <rect x="64" y="72" width="995" height="650" fill="none" stroke="#d1fae5" stroke-width="1" rx="8"/>
  <text x="561" y="168" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" letter-spacing="6" fill="#0f766e">SERTIFIKAT DIGITAL</text>
  <text x="561" y="238" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="bold" fill="#0f172a">${title}</text>
  <line x1="361" y1="272" x2="761" y2="272" stroke="#22c55e" stroke-width="3"/>
  <text x="561" y="332" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#475569">Diberikan kepada</text>
  <text x="561" y="410" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="bold" fill="#0f766e">${name}</text>
  <text x="561" y="462" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#475569">${description}</text>
  <text x="561" y="536" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#334155">${appName}</text>
  <text x="561" y="618" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#64748b">Diterbitkan ${issued}</text>
  <text x="561" y="666" text-anchor="middle" font-family="'Courier New', monospace" font-size="14" fill="#0f766e">${code}</text>
  <text x="561" y="700" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#94a3b8">Verifikasi keaslian: /api/v1/certificates/${code}</text>
</svg>`;
}
