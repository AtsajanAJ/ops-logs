import { describe, expect, it } from "vitest";

import { getBreadcrumbs } from "./breadcrumbs";

describe("getBreadcrumbs", () => {
  it("labels the home incidents page", () => {
    expect(getBreadcrumbs("/")).toEqual([{ labelKey: "crumb.incidents" }]);
  });

  it("builds nested settings crumbs", () => {
    expect(getBreadcrumbs("/settings/users")).toEqual([
      { labelKey: "crumb.home", href: "/" },
      { labelKey: "crumb.settings", href: "/settings" },
      { labelKey: "crumb.users" },
    ]);
  });

  it("uses a generic detail label for dynamic ids", () => {
    expect(getBreadcrumbs("/reports/cm123456789012345678901234")).toEqual([
      { labelKey: "crumb.home", href: "/" },
      { labelKey: "crumb.weeklyReports", href: "/reports" },
      { labelKey: "crumb.detail" },
    ]);
  });
});
