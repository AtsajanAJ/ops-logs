import { IncidentForm } from "@/components/incident-form";
import { IncidentList } from "@/components/incident-list";
import { T } from "@/components/t";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { writableSitesFor } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

export default async function Home(): Promise<React.JSX.Element> {
  const user = await getCurrentUser();
  const canWrite = user ? writableSitesFor(user).length > 0 : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(20rem,0.76fr)_minmax(0,1.24fr)]">
        <Card className="hidden border border-slate-200 bg-white py-0 shadow-sm ring-0 lg:sticky lg:top-6 lg:block">
          <CardHeader className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <CardTitle className="text-lg text-slate-950">
              <T k="home.quickLogTitle" />
            </CardTitle>
            <CardDescription>
              {canWrite ? (
                <T k="home.quickLogCanWrite" />
              ) : (
                <T k="home.quickLogReadOnly" />
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-6 sm:px-6">
            <IncidentForm />
          </CardContent>
        </Card>

        <IncidentList />
      </div>
    </div>
  );
}
