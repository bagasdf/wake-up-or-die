"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

export type HomeData = {
  stats: { articles: number; quizzes: number; badges: number };
  latestArticles: Array<{
    slug: string;
    title: string;
    excerpt: string;
    coverImageUrl: string | null;
    category: string;
    readingMinutes: number;
  }>;
  emergencyContacts: Array<{
    name: string;
    organization: string | null;
    phone: string | null;
    is24h: boolean;
    category: string;
  }>;
};

export function useHome() {
  const [state, setState] = useState<{ data: HomeData | null; error: boolean }>(
    {
      data: null,
      error: false,
    },
  );

  useEffect(() => {
    let alive = true;
    apiJson<HomeData>("/api/home")
      .then((data) => {
        if (alive) setState({ data, error: false });
      })
      .catch(() => {
        if (alive) setState({ data: null, error: true });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
