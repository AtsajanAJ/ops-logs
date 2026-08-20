import { PageHeading } from "@/components/page-heading";
import { SummaryWorkspace } from "@/components/summary-workspace";
import { getCurrentWeekRange } from "@/lib/summaries";

export default function SummariesPage(): React.JSX.Element {
  const defaultRange = getCurrentWeekRange();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeading
        title="Prepare weekly report"
        description="Anonymize ops entries (incidents and services), generate a Gemini draft, then save it to your weekly reports library."
        className="mb-8"
      />

      <SummaryWorkspace defaultRange={defaultRange} />
    </div>
  );
}
