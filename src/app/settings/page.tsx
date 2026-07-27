import { Database, Download, KeyRound, ShieldAlert } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        <div className="mb-9 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-orange-700 uppercase">
              Phase 04 · Data and reliability
            </p>
          </div>
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Keep control of the record.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
            Export your data, verify recovery settings, and keep credentials
            outside the repository.
          </p>
        </div>

        <div className="grid gap-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Download className="mt-0.5 size-5 text-slate-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Data export
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  CSV contains incident records for spreadsheets. JSON is a
                  complete versioned archive containing incidents and weekly
                  summaries.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="/api/export/incidents"
                download
                className={cn(buttonVariants({ variant: "outline" }), "h-10")}
              >
                Download incident CSV
              </a>
              <a
                href="/api/export/archive"
                download
                className={cn(buttonVariants(), "h-10")}
              >
                Download complete JSON
              </a>
            </div>
            <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              Exports contain raw operational data. Store them securely and do
              not upload them to public services.
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 size-5 text-slate-500" />
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

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-5 text-slate-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Credentials
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep `DATABASE_URL` and `GEMINI_API_KEY` only in `.env`.
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
