"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <AlertTriangle aria-hidden="true" className="mx-auto size-7 text-red-600" />
        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          This view could not be loaded
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Try the request again. If it keeps failing, check the terminal and
          database connection.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-500">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <Button type="button" onClick={reset} className="h-11">
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          >
            Incident log
          </Link>
        </div>
      </div>
    </main>
  );
}
