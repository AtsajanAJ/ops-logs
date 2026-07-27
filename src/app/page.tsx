import { AppHeader } from "@/components/app-header";
import { IncidentForm } from "@/components/incident-form";
import { IncidentList } from "@/components/incident-list";
import { PageHeading } from "@/components/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeading
          title="Incident log"
          description="Capture operational issues while the details are fresh, then search and resolve them from one place."
          className="mb-6"
        />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(20rem,0.76fr)_minmax(0,1.24fr)]">
          <Card className="hidden border border-slate-200 bg-white py-0 shadow-sm ring-0 lg:sticky lg:top-24 lg:block">
            <CardHeader className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <CardTitle className="text-lg text-slate-950">
                Quick log entry
              </CardTitle>
              <CardDescription>
                Required fields are marked. Optional context can be added now or later.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 py-6 sm:px-6">
              <IncidentForm />
            </CardContent>
          </Card>

          <IncidentList />
        </div>
      </div>
    </main>
  );
}
