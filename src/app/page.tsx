import { AppHeader } from "@/components/app-header";
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
      <AppHeader />

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
