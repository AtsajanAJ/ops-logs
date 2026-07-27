import Link from "next/link";
import { MapPinOff } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <div className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <MapPinOff className="mx-auto size-7 text-slate-400" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            View not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested operations page does not exist.
          </p>
          <Link href="/" className={`${buttonVariants()} mt-5`}>
            Return to incident log
          </Link>
        </div>
      </div>
    </main>
  );
}
