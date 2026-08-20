export const siteValues = ["BANGKOK", "PHUKET"] as const;

export type SiteValue = (typeof siteValues)[number];

export const siteLabels: Record<SiteValue, string> = {
  BANGKOK: "Bangkok",
  PHUKET: "Phuket",
};

export const userRoleValues = ["VISITOR", "MEMBER", "ADMIN"] as const;

export type UserRoleValue = (typeof userRoleValues)[number];

export const userRoleLabels: Record<UserRoleValue, string> = {
  VISITOR: "Visitor",
  MEMBER: "Member",
  ADMIN: "Admin",
};
