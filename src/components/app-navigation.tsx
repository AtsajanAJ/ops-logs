"use client";

import { BarChart3, BookOpenText, FileClock, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DraftCountBadge } from "@/components/draft-notification";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Incidents",
    desktopLabel: "Incident log",
    icon: BookOpenText,
  },
  {
    href: "/summaries",
    label: "Reports",
    desktopLabel: "Reports",
    icon: FileClock,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    desktopLabel: "Dashboard",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "Settings",
    desktopLabel: "Settings",
    icon: Settings,
  },
] as const;

export function AppNavigation(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "ui-transition flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
                  isActive
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span>{item.desktopLabel}</span>
                {item.href === "/summaries" && <DraftCountBadge />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
