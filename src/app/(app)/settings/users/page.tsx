import type { Metadata } from "next";
import Link from "next/link";

import { UserAccessManager } from "@/components/user-access-manager";
import { PageHeading } from "@/components/page-heading";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "User access",
};

export default async function UsersSettingsPage(): Promise<React.JSX.Element> {
  await requireAdmin();

  const users = await getDb().user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      homeSite: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeading
        title="User access"
        description="Promote visitors to Member with a home site, or grant Admin. Visitors remain read-only."
        className="mb-6"
      />

      <p className="mb-4 text-sm text-slate-600">
        <Link href="/settings" className="font-medium text-orange-700 hover:underline">
          ← Back to settings
        </Link>
      </p>

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-2 sm:px-6">
        <UserAccessManager
          users={users.map((user) => ({
            ...user,
            createdAt: user.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
