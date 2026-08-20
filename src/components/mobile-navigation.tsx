"use client";

import {
  BarChart3,
  BookOpenText,
  Library,
  Plus,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DraftCountBadge } from "@/components/draft-notification";
import { IncidentForm } from "@/components/incident-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { writableSitesFor } from "@/lib/permissions";
import { useCurrentAuthUser } from "@/lib/use-current-auth-user";
import { cn } from "@/lib/utils";

const MOBILE_ITEMS = [
  { href: "/", label: "Incidents", icon: BookOpenText },
  { href: "/summaries", label: "Prepare", icon: WandSparkles },
  { href: "/reports", label: "Reports", icon: Library },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
] as const;

function MobileLink({
  item,
}: {
  item: (typeof MOBILE_ITEMS)[number];
}): React.JSX.Element {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "ui-transition relative flex h-16 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-inset",
        isActive ? "text-slate-950" : "text-slate-500 active:bg-slate-100",
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span className="truncate">{item.label}</span>
      {item.href === "/summaries" && (
        <span className="absolute top-1.5 left-1/2 ml-1">
          <DraftCountBadge />
        </span>
      )}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute top-0 h-0.5 w-8 rounded-full bg-slate-950"
        />
      )}
    </Link>
  );
}

export function MobileNavigation(): React.JSX.Element {
  const { user } = useCurrentAuthUser();
  const canWrite = user ? writableSitesFor(user).length > 0 : false;

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-2xl grid-cols-5 px-1">
        <li>
          <MobileLink item={MOBILE_ITEMS[0]} />
        </li>
        <li>
          <MobileLink item={MOBILE_ITEMS[1]} />
        </li>
        <li className="relative">
          {canWrite ? (
            <Dialog>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="absolute inset-x-0 -top-3 mx-auto flex w-full flex-col items-center gap-1 rounded-lg text-xs font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                  />
                }
              >
                <span className="ui-transition flex size-12 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-white shadow-lg transition-transform active:scale-95">
                  <Plus aria-hidden="true" className="size-5" />
                </span>
                <span>Add</span>
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="top-auto! right-0 bottom-0 left-0! max-h-[92dvh] w-full! max-w-none! translate-x-0! translate-y-0! gap-0 overflow-y-auto rounded-b-none p-0"
              >
                <DialogHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 pr-16 text-left">
                  <DialogTitle className="text-lg font-semibold">
                    Log an incident
                  </DialogTitle>
                  <DialogDescription>
                    Capture the essentials now. You can resolve it later.
                  </DialogDescription>
                  <DialogClose
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2.5 right-3 size-11"
                      />
                    }
                  >
                    <X aria-hidden="true" />
                    <span className="sr-only">Close incident form</span>
                  </DialogClose>
                </DialogHeader>
                <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">
                  <IncidentForm idPrefix="mobile-" />
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium text-slate-400">
              <Plus aria-hidden="true" className="size-5 opacity-40" />
              <span>Read-only</span>
            </div>
          )}
        </li>
        <li>
          <MobileLink item={MOBILE_ITEMS[2]} />
        </li>
        <li>
          <MobileLink item={MOBILE_ITEMS[3]} />
        </li>
      </ul>
    </nav>
  );
}
