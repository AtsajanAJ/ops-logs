"use client";

import {
  BarChart3,
  Settings,
  CalendarDays,
  NotebookPen,
  Astroid,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DraftCountBadge } from "@/components/draft-notification";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    labelKey: "nav.incidents",
    desktopKey: "nav.incidentLog",
    icon: NotebookPen,
  },
  {
    href: "/summaries",
    labelKey: "nav.prepare",
    desktopKey: "nav.prepare",
    icon: Astroid,
  },
  {
    href: "/reports",
    labelKey: "nav.weeklyReports",
    desktopKey: "nav.weeklyReports",
    icon: CalendarDays,
  },
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    desktopKey: "nav.dashboard",
    icon: BarChart3,
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    desktopKey: "nav.settings",
    icon: Settings,
  },
] as const;

interface AppNavigationProps {
  collapsed?: boolean;
}

export function AppNavigation({
  collapsed = false,
}: AppNavigationProps): React.JSX.Element {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav id="primary-sidebar-nav" aria-label={t("nav.primary")}>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const desktopLabel = t(item.desktopKey);
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={desktopLabel}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "ui-transition relative flex h-10 w-full items-center rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
                  collapsed ? "justify-center px-0" : "gap-2.5 px-3",
                  isActive
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {collapsed ? (
                  <span className="sr-only">{desktopLabel}</span>
                ) : (
                  <span className="min-w-0 flex-1 truncate">{desktopLabel}</span>
                )}
                {item.href === "/summaries" && (
                  <span
                    className={cn(
                      collapsed
                        ? "absolute top-1 right-1"
                        : "ml-auto shrink-0",
                    )}
                  >
                    <DraftCountBadge />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
