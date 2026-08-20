"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, PanelLeft, PanelLeftClose } from "lucide-react";

import { AppNavigation } from "@/components/app-navigation";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "ops-logs-sidebar-collapsed";

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCollapsedPreference(): Promise<void> {
      const stored = readCollapsedPreference();
      if (!cancelled) {
        setCollapsed(stored);
      }
    }

    void loadCollapsedPreference();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleCollapsed(): void {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside
        suppressHydrationWarning
        className={cn(
          "sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "border-b border-slate-200 py-4",
            collapsed ? "px-2" : "px-4",
          )}
        >
          <Link
            href="/"
            title="Ops Logs"
            className={cn(
              "ui-transition flex items-center rounded-lg outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
              collapsed ? "justify-center" : "gap-3",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Activity aria-hidden="true" className="size-4" />
            </span>
            {!collapsed && (
              <span>
                <span className="block text-sm font-semibold tracking-tight text-slate-950">
                  Ops Logs
                </span>
                <span className="block text-xs text-slate-500">
                  Operations workspace
                </span>
              </span>
            )}
            {collapsed && <span className="sr-only">Ops Logs</span>}
          </Link>
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto py-4",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <AppNavigation collapsed={collapsed} />
        </div>

        <div
          className={cn(
            "border-t border-slate-200 py-3",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="primary-sidebar-nav"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "h-10 w-full text-slate-600 hover:text-slate-950",
              collapsed ? "justify-center px-0" : "justify-start gap-2.5 px-3",
            )}
          >
            {collapsed ? (
              <PanelLeft aria-hidden="true" className="size-4" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-4" />
            )}
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-screen flex-1">{children}</main>
        <MobileNavigation />
      </div>
    </div>
  );
}
