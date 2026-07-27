import { Database, Download, KeyRound, ShieldAlert } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { PageHeading } from "@/components/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeading
          title="Settings"
          description="Export your records, check recovery coverage, and keep local credentials secure."
          className="mb-6"
        />

        <div className="mb-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Exports contain sensitive operational data</p>
            <p className="mt-0.5 text-amber-900">
              Store downloaded files securely and never upload them to public services.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <section className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Download aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-950">
                  Data export
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Use the complete JSON archive for recovery. Download CSV when
                  you only need incident records in a spreadsheet.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/api/export/archive"
                    download
                    className={cn(buttonVariants(), "h-11")}
                  >
                    Download complete JSON
                  </a>
                  <a
                    href="/api/export/incidents"
                    download
                    className={cn(buttonVariants({ variant: "outline" }), "h-11")}
                  >
                    Download incident CSV
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Database aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Neon recovery
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Point-in-time restore retention depends on your Neon plan and
                  project settings. Verify the current retention window in the
                  Neon console before relying on it as your only backup.
                </p>
              </div>
            </div>
          </section>

          <section className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <KeyRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Credentials
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>{" "}
                  and <code className="rounded bg-slate-100 px-1">GEMINI_API_KEY</code>{" "}
                  only in <code className="rounded bg-slate-100 px-1">.env</code>.
                  Restart the development server after rotating either value.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
