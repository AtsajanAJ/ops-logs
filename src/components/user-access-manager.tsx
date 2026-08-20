"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import {
  initialUpdateUserAccessState,
  updateUserAccess,
} from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Site, UserRole } from "@/generated/prisma/client";
import {
  siteLabels,
  siteValues,
  userRoleLabels,
  userRoleValues,
} from "@/lib/sites";

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
  return (
    <Button type="submit" size="sm" disabled={pending} className="h-9">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

function UserAccessRow({ user }: { user: ManagedUser }): React.JSX.Element {
  const [state, action] = useActionState(
    updateUserAccess,
    initialUpdateUserAccessState,
  );

  useEffect(() => {
    if (state.status === "success") {
      // Server revalidates the page; no client cache to clear.
    }
  }, [state]);

  return (
    <form
      action={action}
      className="grid gap-3 border-b border-slate-200 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(8rem,0.7fr))_auto] sm:items-end"
    >
      <input type="hidden" name="userId" value={user.id} />
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-950">{user.name}</p>
        <p className="truncate text-sm text-slate-500">{user.email}</p>
        {state.message ? (
          <p
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

      <div className="grid gap-1.5">
        <Label htmlFor={`role-${user.id}`} className="text-xs text-slate-500">
          Role
        </Label>
        <Select name="role" defaultValue={user.role}>
          <SelectTrigger id={`role-${user.id}`} className="h-9! w-full bg-white">
            <SelectValue>
              {(value) =>
                userRoleLabels[value as keyof typeof userRoleLabels] ??
                String(value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {userRoleValues.map((role) => (
              <SelectItem key={role} value={role}>
                {userRoleLabels[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label
          htmlFor={`site-${user.id}`}
          className="text-xs text-slate-500"
        >
          Home site
        </Label>
        <Select name="homeSite" defaultValue={user.homeSite ?? undefined}>
          <SelectTrigger id={`site-${user.id}`} className="h-9! w-full bg-white">
            <SelectValue placeholder="None">
              {(value) =>
                value
                  ? siteLabels[value as keyof typeof siteLabels]
                  : "None"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {siteValues.map((site) => (
              <SelectItem key={site} value={site}>
                {siteLabels[site]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SaveButton />
    </form>
  );
}

export function UserAccessManager({
  users,
}: {
  users: ManagedUser[];
}): React.JSX.Element {
  if (users.length === 0) {
    return (
      <p className="text-sm text-slate-600">No registered users yet.</p>
    );
  }

  return (
    <div className="divide-y-0">
      {users.map((user) => (
        <UserAccessRow key={user.id} user={user} />
      ))}
    </div>
  );
}
