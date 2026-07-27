import { Activity, ShieldCheck } from "lucide-react";

import { IncidentForm } from "@/components/incident-form";
import { IncidentList } from "@/components/incident-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-slate-950 text-white">
              <Activity aria-hidden="true" className="size-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950">
                Ops Logs
              </p>
              <p className="font-mono text-[0.62rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                Personal operations desk
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 font-mono text-[0.65rem] font-semibold tracking-[0.12em] text-slate-500 uppercase sm:flex">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-emerald-600" />
            Single-user workspace
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        <div className="mb-9 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-orange-700 uppercase">
              Phase 01 · Core logging
            </p>
          </div>
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Record the signal.
            <span className="block text-slate-500">
              Keep the operational context.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Capture an incident while the details are fresh. Entries stay ordered,
            filterable, and ready for review.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(20rem,0.78fr)_minmax(0,1.22fr)] xl:gap-12">
          <Card className="border border-slate-200 bg-slate-50/90 py-0 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-0 lg:sticky lg:top-8">
            <CardHeader className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <CardTitle className="text-lg text-slate-950">
                Quick log entry
              </CardTitle>
              <CardDescription>
                The essentials first. Add details before they disappear.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 py-6 sm:px-6">
              <IncidentForm />
            </CardContent>
          </Card>

          <IncidentList />
        </div>
      </div>
    </main>
  );
}
