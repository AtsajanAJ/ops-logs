import Link from "next/link";
import { Activity } from "lucide-react";

import { AppNavigation } from "@/components/app-navigation";
import { MobileNavigation } from "@/components/mobile-navigation";

export function AppHeader(): React.JSX.Element {
  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur-md lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="ui-transition flex min-h-11 items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 lg:min-h-9"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Activity aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-slate-950">
                Ops Logs
              </span>
              <span className="block text-xs text-slate-500">
                Operations workspace
              </span>
            </span>
          </Link>

          <AppNavigation />
        </div>
      </header>
      <MobileNavigation />
    </>
  );
}
