import { AppHeader } from "@/components/app-header";
import { DashboardView } from "@/components/dashboard-view";
import { PageHeading } from "@/components/page-heading";

export default function DashboardPage(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeading
          title="Dashboard"
          description="Review eight weeks of incident volume, unresolved work, and severity trends."
          className="mb-6"
        />

        <DashboardView />
      </div>
    </main>
  );
}
