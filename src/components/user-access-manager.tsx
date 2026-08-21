"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import { updateUserAccess } from "@/app/actions/users";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import type { Site, UserRole } from "@/generated/prisma/client";
import {
  assignableHomeSitesFor,
  assignableRolesFor,
  type AuthUser,
} from "@/lib/permissions";
import { initialUpdateUserAccessState } from "@/lib/user-access";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  homeSite: Site | null;
  createdAt: string;
};

function SaveButton(): React.JSX.Element {
  const { pending } = useFormStatus();
  const { t } = useLocale();
  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      className="h-11 w-full min-w-[7.5rem] sm:w-auto"
    >
      {pending ? t("settingsUi.saving") : t("settingsUi.saveAccess")}
    </Button>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-xs leading-4 font-medium text-slate-500"
    >
      {children}
    </Label>
  );
}

function needsHomeSite(role: UserRole): boolean {
  return role === "MEMBER" || role === "ADMIN";
}

function UserAccessRow({
  user,
  actor,
}: {
  user: ManagedUser;
  actor: AuthUser;
}): React.JSX.Element {
  const [state, action] = useActionState(
    updateUserAccess,
    initialUpdateUserAccessState,
  );
  const roleOptions = assignableRolesFor(actor);
  const siteOptions = assignableHomeSitesFor(actor);
  const initialRole = roleOptions.includes(user.role)
    ? user.role
    : (roleOptions[0] ?? user.role);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [homeSite, setHomeSite] = useState(() => {
    if (!needsHomeSite(initialRole)) return "__none__";
    if (user.homeSite && siteOptions.includes(user.homeSite)) {
      return user.homeSite;
    }
    return siteOptions[0] ?? "__none__";
  });
  const messageId = useId();
  const roleId = `role-${user.id}`;
  const siteId = `site-${user.id}`;
  const homeSiteRequired = needsHomeSite(role);
  const { t } = useLocale();

  useEffect(() => {
    if (state.status !== "success") return;

    let cancelled = false;

    async function notifySaved() {
      await Promise.resolve();
      if (cancelled) return;
      toast.add({
        type: "success",
        title: t("toast.userAccessSavedTitle"),
        description: t("toast.userAccessSavedDescription"),
      });
    }

    void notifySaved();
    return () => {
      cancelled = true;
    };
  }, [state.status, t]);

  function onRoleChange(value: UserRole | null): void {
    const nextRole = value ?? user.role;
    setRole(nextRole);
    if (!needsHomeSite(nextRole)) {
      setHomeSite("__none__");
      return;
    }
    if (homeSite !== "__none__" && siteOptions.includes(homeSite as Site)) {
      return;
    }
    setHomeSite(siteOptions[0] ?? "__none__");
  }

  return (
    <form
      action={action}
      className="grid gap-x-4 gap-y-3 border-b border-slate-200 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
    >
      <input type="hidden" name="userId" value={user.id} />

      <div className="min-w-0 sm:pt-5">
        <p className="truncate font-medium text-slate-950">{user.name}</p>
        <p className="truncate text-sm text-slate-500">{user.email}</p>
        {state.message ? (
          <p
            id={messageId}
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error"
                ? "mt-1 text-xs text-red-700"
                : "mt-1 text-xs text-emerald-700"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-1.5">
        <FieldLabel htmlFor={roleId}>{t("settingsUi.role")}</FieldLabel>
        <Select
          name="role"
          value={role}
          onValueChange={(value) => onRoleChange(value as UserRole | null)}
        >
          <SelectTrigger
            id={roleId}
            className="h-11! w-full! min-w-0 bg-white"
            aria-describedby={state.message ? messageId : undefined}
          >
            <SelectValue>
              {(value) => t(`roles.${(value as UserRole) ?? user.role}`)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((roleOption) => (
              <SelectItem key={roleOption} value={roleOption}>
                {t(`roles.${roleOption}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid min-w-0 gap-1.5">
        <FieldLabel htmlFor={siteId}>{t("settingsUi.homeSite")}</FieldLabel>
        <Select
          name="homeSite"
          value={homeSite}
          onValueChange={(value) => setHomeSite(value ?? "__none__")}
          disabled={!homeSiteRequired && siteOptions.length === 0}
        >
          <SelectTrigger
            id={siteId}
            className="h-11! w-full! min-w-0 bg-white"
            aria-describedby={state.message ? messageId : undefined}
          >
            <SelectValue placeholder={t("settingsUi.none")}>
              {(value) =>
                value && value !== "__none__"
                  ? t(`sites.${value as Site}`)
                  : t("settingsUi.none")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {!homeSiteRequired ? (
              <SelectItem value="__none__">{t("settingsUi.none")}</SelectItem>
            ) : null}
            {siteOptions.map((site) => (
              <SelectItem key={site} value={site}>
                {t(`sites.${site}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid min-w-0 gap-1.5">
        <span className="invisible text-xs leading-4 font-medium" aria-hidden>
          Action
        </span>
        <SaveButton />
      </div>
    </form>
  );
}

export function UserAccessManager({
  users,
  actor,
}: {
  users: ManagedUser[];
  actor: AuthUser;
}): React.JSX.Element {
  const { t } = useLocale();

  if (users.length === 0) {
    return <p className="text-sm text-slate-600">{t("settingsUi.noUsers")}</p>;
  }

  return (
    <div>
      <p className="border-b border-slate-100 px-0 pb-4 text-xs leading-5 text-slate-500">
        {t("settingsUi.accessHint")}
      </p>
      {users.map((user) => (
        <UserAccessRow key={user.id} user={user} actor={actor} />
      ))}
    </div>
  );
}
