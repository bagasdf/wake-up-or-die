import { QuizPlayer } from "@/components/quiz/quiz-player";

type Props = { params: Promise<{ slug: string }> };

export default async function QuizAttemptPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="flex flex-col min-h-screen pt-20">
      <QuizPlayer slug={slug} />
    </main>
  );
}

export const instant = false;
