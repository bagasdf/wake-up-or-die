import { ArticleDetail } from "@/components/articles/article-detail";

type Props = { params: Promise<{ slug: string }> };

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="flex flex-col min-h-screen pt-20">
      <ArticleDetail slug={slug} />
    </main>
  );
}

export const instant = false;
