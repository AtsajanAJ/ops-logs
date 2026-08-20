"use client";

import { useActionState, useId } from "react";
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
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      className="h-11 w-full min-w-[7.5rem] sm:w-auto"
    >
      {pending ? "Saving…" : "Save access"}
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

function UserAccessRow({ user }: { user: ManagedUser }): React.JSX.Element {
  const [state, action] = useActionState(
    updateUserAccess,
    initialUpdateUserAccessState,
  );
  const messageId = useId();
  const roleId = `role-${user.id}`;
  const siteId = `site-${user.id}`;

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
        <FieldLabel htmlFor={roleId}>Role</FieldLabel>
        <Select name="role" defaultValue={user.role}>
          <SelectTrigger
            id={roleId}
            className="h-11! w-full! min-w-0 bg-white"
            aria-describedby={state.message ? messageId : undefined}
          >
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

      <div className="grid min-w-0 gap-1.5">
        <FieldLabel htmlFor={siteId}>Home site</FieldLabel>
        <Select name="homeSite" defaultValue={user.homeSite ?? "__none__"}>
          <SelectTrigger
            id={siteId}
            className="h-11! w-full! min-w-0 bg-white"
            aria-describedby={state.message ? messageId : undefined}
          >
            <SelectValue placeholder="None">
              {(value) =>
                value && value !== "__none__"
                  ? siteLabels[value as keyof typeof siteLabels]
                  : "None"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {siteValues.map((site) => (
              <SelectItem key={site} value={site}>
                {siteLabels[site]}
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
}: {
  users: ManagedUser[];
}): React.JSX.Element {
  if (users.length === 0) {
    return (
      <p className="text-sm text-slate-600">No registered users yet.</p>
    );
  }

  return (
    <div>
      <p className="border-b border-slate-100 px-0 pb-4 text-xs leading-5 text-slate-500">
        Members need a home site. Use None for Visitor or Admin.
      </p>
      {users.map((user) => (
        <UserAccessRow key={user.id} user={user} />
      ))}
    </div>
  );
}
