import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { isGoogleAuthConfigured } from "@/lib/auth";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getSession();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium tracking-wide text-orange-600 uppercase">
          Ops Logs
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isGoogleAuthConfigured
            ? "Continue with Google or use your email and password."
            : "Use your team email and password to continue."}
        </p>
      </div>
      <LoginForm googleEnabled={isGoogleAuthConfigured} />
    </main>
  );
}
