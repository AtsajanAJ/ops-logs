"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function RegisterForm(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Registration failed. Try again.");
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
        <Label htmlFor="register-name">Name</Label>
        <Input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="h-11 bg-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 bg-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 bg-white"
        />
        <p className="text-xs text-slate-500">At least 8 characters.</p>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
