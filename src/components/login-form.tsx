"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await authClient.signIn.email({
      email,
      password,
    });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Sign in failed. Check your credentials.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 bg-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="h-11 bg-white"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-orange-700 hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
