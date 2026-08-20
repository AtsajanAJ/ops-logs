import { describe, expect, it } from "vitest";

import { getBreadcrumbs } from "./breadcrumbs";

describe("getBreadcrumbs", () => {
  it("labels the home incidents page", () => {
    expect(getBreadcrumbs("/")).toEqual([{ label: "Incidents" }]);
  });

  it("builds nested settings crumbs", () => {
    expect(getBreadcrumbs("/settings/users")).toEqual([
      { label: "Home", href: "/" },
      { label: "Settings", href: "/settings" },
      { label: "User access" },
    ]);
  });

  it("uses a generic detail label for dynamic ids", () => {
    expect(getBreadcrumbs("/reports/cm123456789012345678901234")).toEqual([
      { label: "Home", href: "/" },
      { label: "Weekly reports", href: "/reports" },
      { label: "Detail" },
    ]);
  });
});
