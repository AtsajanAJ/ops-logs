import { PageHeading } from "@/components/page-heading";
import { SummaryWorkspace } from "@/components/summary-workspace";
import { T } from "@/components/t";
import { getCurrentWeekRange } from "@/lib/summaries";

export default function SummariesPage(): React.JSX.Element {
  const defaultRange = getCurrentWeekRange();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeading
        title={<T k="pages.prepareTitle" />}
        description={<T k="pages.prepareDescription" />}
        className="mb-8"
      />

      <SummaryWorkspace defaultRange={defaultRange} />
    </div>
  );
}
