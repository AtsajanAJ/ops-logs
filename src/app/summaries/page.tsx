import { AppHeader } from "@/components/app-header";
import { SummaryWorkspace } from "@/components/summary-workspace";
import { getCurrentWeekRange } from "@/lib/summaries";

export default function SummariesPage(): React.JSX.Element {
  const defaultRange = getCurrentWeekRange();

  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-orange-700 uppercase">
              Phase 02 · AI-assisted reporting
            </p>
          </div>
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Protect the details.
            <span className="block text-slate-500">Then shape the weekly story.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Review exactly what leaves this app, generate a draft with Gemini,
            then edit and approve it yourself.
          </p>
        </div>

        <SummaryWorkspace defaultRange={defaultRange} />
      </div>
    </main>
  );
}
