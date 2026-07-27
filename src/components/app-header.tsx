import Link from "next/link";
import {
  Activity,
  FileText,
  LayoutDashboard,
  ListTree,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { DraftNotification } from "@/components/draft-notification";

export function AppHeader(): React.JSX.Element {
  return (
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-slate-950 text-white">
              <Activity aria-hidden="true" className="size-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950">
                Ops Logs
              </p>
              <p className="font-mono text-[0.62rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                Personal operations desk
              </p>
            </div>
          </Link>
          <ShieldCheck
            aria-label="Single-user workspace"
            className="size-4 text-emerald-600 md:hidden"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <nav
            aria-label="Primary navigation"
            className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1"
          >
            <Link
              href="/"
              className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-950"
            >
              <ListTree aria-hidden="true" className="size-3.5" />
              Incident log
            </Link>
            <Link
              href="/summaries"
              className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-950"
            >
              <FileText aria-hidden="true" className="size-3.5" />
              Weekly reports
            </Link>
            <Link
              href="/dashboard"
              className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-950"
            >
              <LayoutDashboard aria-hidden="true" className="size-3.5" />
              Dashboard
            </Link>
            <Link
              href="/settings"
              aria-label="Data and reliability settings"
              className="flex size-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-950"
            >
              <Settings aria-hidden="true" className="size-3.5" />
            </Link>
          </nav>
          <DraftNotification />
          <div className="hidden items-center gap-2 font-mono text-[0.65rem] font-semibold tracking-[0.12em] text-slate-500 uppercase lg:flex">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-emerald-600" />
            Single-user workspace
          </div>
        </div>
      </div>
    </header>
  );
}
