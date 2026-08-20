export type BreadcrumbCrumb = {
  labelKey: string;
  href?: string;
};

const ROUTE_KEYS: Record<string, string> = {
  "": "crumb.incidents",
  summaries: "crumb.prepare",
  reports: "crumb.weeklyReports",
  dashboard: "crumb.dashboard",
  settings: "crumb.settings",
  users: "crumb.users",
};

export function getBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ labelKey: "crumb.incidents" }];
  }

  const crumbs: BreadcrumbCrumb[] = [{ labelKey: "crumb.home", href: "/" }];
  let href = "";

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    href += `/${segment}`;
    const isLast = index === segments.length - 1;
    const knownKey = ROUTE_KEYS[segment];

    const labelKey =
      knownKey ?? (segment.length > 20 ? "crumb.detail" : segment);

    crumbs.push(isLast ? { labelKey } : { labelKey, href });
  }

  return crumbs;
}
