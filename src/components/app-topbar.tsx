"use client";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { ProfileMenu } from "@/components/profile-menu";

export function AppTopBar(): React.JSX.Element {
  return (
    <header className="pointer-events-none sticky top-0 z-30 bg-transparent">
      <div className="pointer-events-none flex h-16 items-center justify-between gap-4 pl-4 sm:pl-6 lg:pl-8 pr-3 sm:pr-4 lg:pr-5">
        <div className="pointer-events-auto min-w-0 max-w-[min(100%,36rem)] rounded-full border border-slate-200/80 bg-white px-3.5 py-2 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.28)]">
          <AppBreadcrumb />
        </div>
        <div className="pointer-events-auto shrink-0 rounded-full border border-slate-200/80 bg-white p-0.5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.28)] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-slate-300 hover:shadow-[0_12px_32px_-10px_rgba(15,23,42,0.35)] active:translate-y-0 active:scale-100">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
