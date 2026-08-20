import { DashboardView } from "@/components/dashboard-view";
import { PageHeading } from "@/components/page-heading";
import { T } from "@/components/t";

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeading
        title={<T k="pages.dashboardTitle" />}
        description={<T k="pages.dashboardDescription" />}
        className="mb-6"
      />

      <DashboardView />
    </div>
  );
}
