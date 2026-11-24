import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
} from "pdf-lib";

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function safePdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\u0000-\u00ff]/g, "?");
}

function centerText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: ReturnType<typeof rgb>,
  centerX = 421,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}

function drawTrackedText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  options: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> },
  spacing: number,
) {
  let x = options.x;
  for (const character of text) {
    page.drawText(character, { ...options, x });
    x += options.font.widthOfTextAtSize(character, options.size) + spacing;
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";

  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

export async function renderCertificatePdf(
  input: CertificateInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${input.title} — ${input.recipientName}`);
  pdf.setAuthor(input.appName);
  pdf.setSubject("Sertifikat kelulusan pusat belajar Wake Up or Die");
  pdf.setCreator(input.appName);
  pdf.setCreationDate(input.issuedAt);
  pdf.setModificationDate(input.issuedAt);

  const page = pdf.addPage([842, 595]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const ink = rgb(0.11, 0.09, 0.08);
  const paper = rgb(0.98, 0.96, 0.9);
  const vermilion = rgb(0.91, 0.22, 0.12);
  const coral = rgb(1, 0.39, 0.27);
  const teal = rgb(0.06, 0.42, 0.39);
  const muted = rgb(0.36, 0.32, 0.29);

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: paper });
  page.drawRectangle({ x: 0, y: 543, width: 842, height: 52, color: ink });
  page.drawRectangle({ x: 0, y: 535, width: 842, height: 8, color: vermilion });

  // Heavy offset frame and registration marks give print a poster-like edge.
  page.drawRectangle({
    x: 28,
    y: 26,
    width: 786,
    height: 492,
    color: undefined,
    borderColor: ink,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 38,
    y: 36,
    width: 766,
    height: 472,
    color: undefined,
    borderColor: vermilion,
    borderWidth: 1,
  });

  drawTrackedText(page, "WAKE UP / CHOOSE WELL", {
    x: 50,
    y: 562,
    size: 12,
    font: bold,
    color: paper,
  }, 1.4);
  drawTrackedText(page, "LEARNING RECORD   •   INDONESIA", {
    x: 597,
    y: 562,
    size: 9,
    font: bold,
    color: rgb(1, 0.68, 0.55),
  }, 0.7);

  // Halftone field and rosette add visual detail without raster assets.
  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      page.drawCircle({
        x: 95 + column * 11,
        y: 426 + row * 11,
        size: 1.6,
        color: coral,
        opacity: 0.36,
      });
    }
  }
  page.drawCircle({ x: 421, y: 441, size: 47, color: ink });
  page.drawCircle({
    x: 421,
    y: 441,
    size: 39,
    color: vermilion,
    borderColor: paper,
    borderWidth: 2,
  });
  page.drawCircle({
    x: 421,
    y: 441,
    size: 29,
    color: paper,
    borderColor: ink,
    borderWidth: 1,
  });
  page.drawText("WU", {
    x: 407,
    y: 435,
    size: 16,
    font: serif,
    color: ink,
  });

  page.drawRectangle({
    x: 655,
    y: 412,
    width: 129,
    height: 39,
    color: teal,
    borderColor: ink,
    borderWidth: 2,
    rotate: degrees(-5),
  });
  drawTrackedText(page, "LULUS", {
    x: 686,
    y: 425,
    size: 17,
    font: bold,
    color: paper,
  }, 2);

  centerText(page, "SERTIFIKAT KELULUSAN", bold, 12, 382, teal);
  const title = safePdfText(input.title).toUpperCase();
  const titleSize = Math.min(25, 680 / Math.max(1, serif.widthOfTextAtSize(title, 25)) * 25);
  centerText(page, title, serif, titleSize, 347, ink);
  page.drawLine({
    start: { x: 285, y: 331 },
    end: { x: 557, y: 331 },
    thickness: 4,
    color: vermilion,
  });
  centerText(page, "Diberikan kepada", regular, 12, 305, muted);

  const name = safePdfText(input.recipientName);
  const nameFontSize = Math.min(34, 510 / Math.max(1, serif.widthOfTextAtSize(name, 34)) * 34);
  centerText(page, name, serif, nameFontSize, 258, ink);
  page.drawLine({
    start: { x: 162, y: 244 },
    end: { x: 680, y: 244 },
    thickness: 1.5,
    color: ink,
  });

  const description = safePdfText(
    input.description ?? "atas penyelesaian materi edukasi dan pemahaman langkah hidup sehat",
  );
  const descriptionSize = 11;
  const descriptionLines = wrapText(description, regular, descriptionSize, 560);
  descriptionLines.forEach((line, index) =>
    centerText(page, line, regular, descriptionSize, 218 - index * 17, muted),
  );

  page.drawLine({
    start: { x: 92, y: 119 },
    end: { x: 750, y: 119 },
    thickness: 1,
    color: rgb(0.77, 0.72, 0.65),
  });
  drawTrackedText(page, "DITERBITKAN", {
    x: 70,
    y: 96,
    size: 8,
    font: bold,
    color: teal,
  }, 0.9);
  page.drawText(safePdfText(formatDate(input.issuedAt)), {
    x: 70,
    y: 76,
    size: 12,
    font: bold,
    color: ink,
  });
  drawTrackedText(page, "PENYELENGGARA", {
    x: 320,
    y: 96,
    size: 8,
    font: bold,
    color: teal,
  }, 0.9);
  page.drawText(safePdfText(input.appName), {
    x: 320,
    y: 76,
    size: 11,
    font: regular,
    color: ink,
  });
  drawTrackedText(page, "VERIFIKASI", {
    x: 592,
    y: 96,
    size: 8,
    font: bold,
    color: teal,
  }, 0.9);
  page.drawText(safePdfText(input.code), {
    x: 592,
    y: 76,
    size: 12,
    font: bold,
    color: ink,
  });

  // Corner blocks and small checker details make the document easy to spot.
  page.drawRectangle({ x: 39, y: 36, width: 18, height: 18, color: vermilion });
  page.drawRectangle({ x: 57, y: 36, width: 18, height: 18, color: ink });
  page.drawRectangle({ x: 39, y: 54, width: 18, height: 18, color: ink });
  page.drawRectangle({ x: 787, y: 36, width: 17, height: 17, color: teal });
  page.drawRectangle({ x: 770, y: 36, width: 17, height: 17, color: ink });
  page.drawRectangle({ x: 787, y: 53, width: 17, height: 17, color: ink });

  return pdf.save();
}
