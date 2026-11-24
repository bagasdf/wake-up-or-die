"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const fallbackCovers = [
  "/static/images/poster-1.png",
  "/static/images/poster-2.png",
  "/static/images/poster-3.png",
  "/static/images/poster-4.png",
];

const localCovers: Record<string, string> = {
  "mengenal-jenis-narkoba-dan-efeknya": "/static/images/pil.png",
  "dampak-narkoba-pada-otak-remaja": "/static/images/teen-brain.png",
  "cara-menolak-tawaran-narkoba": "/static/images/poster-4.png",
  "hukum-penyalahgunaan-narkoba-di-indonesia": "/static/images/poster-1.png",
  "gejala-awal-kecanduan-dan-cara-mencari-bantuan":
    "/static/images/recovery-support.jpg",
  "mitos-dan-fakta-tentang-narkoba": "/static/images/weed.png",
};

function getFallbackCover(slug: string): string {
  const index = [...slug].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return fallbackCovers[index % fallbackCovers.length];
}

export function ArticleCover({
  slug,
  coverImageUrl,
  alt,
  sizes,
  className,
}: {
  slug: string;
  coverImageUrl?: string | null;
  alt: string;
  sizes: string;
  className: string;
}) {
  const fallback = getFallbackCover(slug);
  const preferred = localCovers[slug] ?? coverImageUrl ?? fallback;
  const [src, setSrc] = useState(preferred);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(preferred);
    setFailed(false);
  }, [preferred]);

  return failed ? null : (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
        else setFailed(true);
      }}
    />
  );
}
