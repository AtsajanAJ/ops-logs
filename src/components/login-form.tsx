"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function RequiredMark(): React.JSX.Element {
  return (
    <span className="text-red-600" aria-hidden="true">
      *
    </span>
  );
}

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const errorId = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [invalidFields, setInvalidFields] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  async function onSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError("");
    setInvalidFields({});
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setInvalidFields({
        email: !email,
        password: !password,
      });
      setError("Enter your email and password to continue.");
      setPending(false);
      return;
    }

    const result = await authClient.signIn.email({
      email,
      password,
    });

    setPending(false);

    if (result.error) {
      setInvalidFields({ email: true, password: true });
      setError(
        result.error.message ??
          "Sign in failed. Check your email and password, then try again.",
      );
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="login-email">
          Email <RequiredMark />
        </Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={invalidFields.email || undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-11 bg-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-password">
          Password <RequiredMark />
        </Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          aria-invalid={invalidFields.password || undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-11 bg-white"
        />
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11" disabled={pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        No account yet?{" "}
        <Link
          href="/register"
          className="font-medium text-orange-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
