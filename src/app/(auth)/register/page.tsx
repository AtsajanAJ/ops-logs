import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/register-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Register",
};

export default async function RegisterPage(): Promise<React.JSX.Element> {
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
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Create account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          New accounts start as Visitor (read-only) until an admin assigns a
          role.
        </p>
      </div>
      <RegisterForm />
    </main>
  );
}
