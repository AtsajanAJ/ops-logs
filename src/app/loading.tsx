import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading(): React.JSX.Element {
  return (
    <main className="min-h-screen" aria-label="Loading operations workspace">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="border-b border-slate-200 pb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(20rem,0.76fr)_minmax(0,1.24fr)]">
          <Skeleton className="h-[34rem] w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
