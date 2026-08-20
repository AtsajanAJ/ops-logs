import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  await requireUser();

  return <AppShell>{children}</AppShell>;
}
