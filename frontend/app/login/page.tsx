import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense>
          <AuthForm mode="signin" />
        </Suspense>
      </main>
    </>
  );
}
