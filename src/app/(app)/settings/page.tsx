import { Download, ShieldAlert, Users } from "lucide-react";

import { PageHeading } from "@/components/page-heading";
import { T } from "@/components/t";
import { buttonVariants } from "@/components/ui/button";
import { canManageUsers } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const user = await getCurrentUser();
  const isAdmin = canManageUsers(user);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeading
        title={<T k="pages.settingsTitle" />}
        description={<T k="pages.settingsDescription" />}
        className="mb-6"
      />

      <div className="mb-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">
            <T k="settingsUi.exportWarningTitle" />
          </p>
          <p className="mt-0.5 text-amber-900">
            <T k="settingsUi.exportWarningBody" />
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isAdmin ? (
          <section className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Users
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-slate-500"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-950">
                  <T k="settingsUi.userAccessTitle" />
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  <T k="settingsUi.userAccessBody" />
                </p>
                <div className="mt-5">
                  <a
                    href="/settings/users"
                    className={cn(buttonVariants(), "h-11")}
                  >
                    <T k="settingsUi.manageUsers" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Download
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-slate-500"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-950">
                <T k="settingsUi.dataExportTitle" />
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                <T k="settingsUi.dataExportBody" />
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/api/export/archive"
                  download
                  className={cn(buttonVariants(), "h-11")}
                >
                  <T k="settingsUi.downloadJson" />
                </a>
                <a
                  href="/api/export/incidents"
                  download
                  className={cn(buttonVariants({ variant: "outline" }), "h-11")}
                >
                  <T k="settingsUi.downloadCsv" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
