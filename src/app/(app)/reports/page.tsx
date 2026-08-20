import { PageHeading } from "@/components/page-heading";
import { SummaryLibrary } from "@/components/summary-library";

export default function ReportsPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeading
        title="Weekly reports"
        description="Browse saved drafts and reviewed weekly reports. Open any report to read, edit, or finalize it."
        className="mb-8"
      />

      <SummaryLibrary />
    </div>
  );
}
