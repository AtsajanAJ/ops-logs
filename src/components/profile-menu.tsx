"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { canManageUsers } from "@/lib/permissions";
import { type UserRoleValue } from "@/lib/sites";
import { useCurrentAuthUser } from "@/lib/use-current-auth-user";
import { useLocale } from "@/components/locale-provider";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function ProfileMenu(): React.JSX.Element {
  const router = useRouter();
  const { user, isPending } = useCurrentAuthUser();
  const { t } = useLocale();

  async function handleSignOut(): Promise<void> {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (isPending || !user) {
    return <div className="size-11" aria-hidden="true" />;
  }

  const roleLabel = t(`roles.${user.role as UserRoleValue}`);
  const siteLabel = user.homeSite ? t(`sites.${user.homeSite}`) : null;
  const isAdmin = canManageUsers(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="size-11 rounded-full p-0 ring-offset-2 transition-[box-shadow,transform] duration-200 ease-out hover:bg-transparent hover:ring-2 hover:ring-orange-400/70 focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-label={t("profile.openMenu")}
          />
        }
      >
        <Avatar className="size-11 bg-slate-950 text-white after:border-slate-800">
          <AvatarFallback className="bg-slate-950 text-sm font-semibold text-white">
            {initialsFromName(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal text-slate-950">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {user.email}
            </span>
            <span className="mt-1 block truncate text-xs text-slate-500">
              {roleLabel}
              {siteLabel ? ` · ${siteLabel}` : ""}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            render={<Link href="/settings" />}
            className="cursor-pointer"
          >
            <Settings />
            {t("profile.settings")}
          </DropdownMenuItem>
          {isAdmin ? (
            <DropdownMenuItem
              render={<Link href="/settings/users" />}
              className="cursor-pointer"
            >
              <Users />
              {t("profile.userAccess")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => {
            void handleSignOut();
          }}
        >
          <LogOut />
          {t("profile.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
