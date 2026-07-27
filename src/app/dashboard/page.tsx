import { AppHeader } from "@/components/app-header";
import { DashboardView } from "@/components/dashboard-view";

export default function DashboardPage(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        <div className="mb-9 max-w-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-orange-700 uppercase">
              Phase 03 · Operational signal
            </p>
          </div>
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            See the workload.
            <span className="block text-slate-500">Spot the pressure early.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            An eight-week view of volume, unresolved work, and severity—built
            from the incident ledger.
          </p>
        </div>

        <DashboardView />
      </div>
    </main>
  );
}
