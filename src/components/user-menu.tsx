"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentAuthUser } from "@/lib/use-current-auth-user";
import { authClient } from "@/lib/auth-client";
import { userRoleLabels, type UserRoleValue } from "@/lib/sites";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps): React.JSX.Element {
  const router = useRouter();
  const { user, isPending } = useCurrentAuthUser();

  async function handleSignOut(): Promise<void> {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (isPending || !user) {
    return <div className="h-10" />;
  }

  const roleLabel =
    userRoleLabels[user.role as UserRoleValue] ?? user.role;

  return (
    <div
      className={cn(
        "grid gap-2",
        collapsed ? "justify-items-center" : "px-0",
      )}
    >
      {!collapsed && (
        <div className="min-w-0 px-1">
          <p className="truncate text-sm font-medium text-slate-950">
            {user.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            {roleLabel}
            {user.homeSite ? ` · ${user.homeSite}` : ""}
          </p>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          void handleSignOut();
        }}
        title="Sign out"
        aria-label="Sign out"
        className={cn(
          "h-10 text-slate-600 hover:text-slate-950",
          collapsed ? "w-10 justify-center px-0" : "w-full justify-start gap-2.5 px-3",
        )}
      >
        <LogOut aria-hidden="true" className="size-4 shrink-0" />
        {!collapsed && <span>Sign out</span>}
      </Button>
    </div>
  );
}
