import { AppHeader } from "@/components/app-header";
import { PageHeading } from "@/components/page-heading";
import { SummaryWorkspace } from "@/components/summary-workspace";
import { getCurrentWeekRange } from "@/lib/summaries";

export default function SummariesPage(): React.JSX.Element {
  const defaultRange = getCurrentWeekRange();

  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeading
          title="Weekly reports"
          description="Prepare anonymized incident data, generate a Gemini draft, then edit and approve the final report."
          className="mb-8"
        />

        <SummaryWorkspace defaultRange={defaultRange} />
      </div>
    </main>
  );
}
