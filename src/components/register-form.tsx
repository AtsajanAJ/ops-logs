"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  AuthMethodDivider,
  GoogleSignInButton,
} from "@/components/google-sign-in-button";
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

export function RegisterForm({
  googleEnabled = false,
}: {
  googleEnabled?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const errorId = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [invalidFields, setInvalidFields] = useState<{
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  async function onSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError("");
    setInvalidFields({});
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const nextInvalid = {
      name: !name,
      email: !email,
      password: password.length < 8,
      confirmPassword: !confirmPassword || password !== confirmPassword,
    };

    if (
      nextInvalid.name ||
      nextInvalid.email ||
      nextInvalid.password ||
      nextInvalid.confirmPassword
    ) {
      setInvalidFields(nextInvalid);
      if (password !== confirmPassword && confirmPassword) {
        setError("Passwords do not match. Re-enter both password fields.");
      } else if (password.length > 0 && password.length < 8) {
        setError("Use a password with at least 8 characters.");
      } else {
        setError("Fill in every required field, then try again.");
      }
      setPending(false);
      return;
    }

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setPending(false);

    if (result.error) {
      setInvalidFields({ email: true });
      setError(
        result.error.message ??
          "Could not create the account. Check the details and try again.",
      );
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {googleEnabled ? (
        <>
          <GoogleSignInButton label="Continue with Google" />
          <AuthMethodDivider />
        </>
      ) : null}
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <div className="grid gap-2">
          <Label htmlFor="register-name">
            Name <RequiredMark />
          </Label>
          <Input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={invalidFields.name || undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-11 bg-white"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="register-email">
            Email <RequiredMark />
          </Label>
          <Input
            id="register-email"
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
          <Label htmlFor="register-password">
            Password <RequiredMark />
          </Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={invalidFields.password || undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-11 bg-white"
          />
          <p className="text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="register-confirm-password">
            Confirm password <RequiredMark />
          </Label>
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={invalidFields.confirmPassword || undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-11 bg-white"
          />
        </div>
        {error ? (
          <p id={errorId} className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="h-11"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-orange-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
