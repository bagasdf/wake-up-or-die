import { ArticleList } from "@/components/articles/article-list";

export default function ArticlesPage() {
  return (
    <main className="flex flex-col min-h-screen pt-20">
      <ArticleList />
    </main>
  );
}

export const instant = false;
