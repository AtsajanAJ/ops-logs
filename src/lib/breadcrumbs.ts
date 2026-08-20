export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

const ROUTE_LABELS: Record<string, string> = {
  "": "Incidents",
  summaries: "Prepare",
  reports: "Weekly reports",
  dashboard: "Dashboard",
  settings: "Settings",
  users: "User access",
};

export function getBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Incidents" }];
  }

  const crumbs: BreadcrumbCrumb[] = [{ label: "Home", href: "/" }];
  let href = "";

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    href += `/${segment}`;
    const isLast = index === segments.length - 1;
    const knownLabel = ROUTE_LABELS[segment];

    // Dynamic ids (cuid-like) → generic page label
    const label =
      knownLabel ??
      (segment.length > 20 ? "Detail" : segment.replaceAll("-", " "));

    crumbs.push(isLast ? { label } : { label, href });
  }

  return crumbs;
}
