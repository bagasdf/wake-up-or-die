import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="flex flex-col min-h-screen pt-20">
      <AuthForm mode="login" />
    </main>
  );
}
