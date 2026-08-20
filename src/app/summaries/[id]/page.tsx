import { redirect } from "next/navigation";

interface LegacySummaryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacySummaryDetailPage({
  params,
}: LegacySummaryDetailPageProps): Promise<never> {
  const { id } = await params;
  redirect(`/reports/${id}`);
}
