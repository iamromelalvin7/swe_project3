import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function RegisterPage() {
  return (
    <main>
      <Header />
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
