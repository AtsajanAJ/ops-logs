import { PageHeading } from "@/components/page-heading";
import { SummaryLibrary } from "@/components/summary-library";
import { T } from "@/components/t";

export default function ReportsPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeading
        title={<T k="pages.reportsTitle" />}
        description={<T k="pages.reportsDescription" />}
        className="mb-8"
      />

      <SummaryLibrary />
    </div>
  );
}
