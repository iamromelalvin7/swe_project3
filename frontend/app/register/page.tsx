import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </main>
    </>
  );
}
