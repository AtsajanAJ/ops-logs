export const en = {
  brand: {
    name: "Ops Logs",
    tagline: "Operations workspace",
  },
  nav: {
    primary: "Primary navigation",
    mobilePrimary: "Mobile primary navigation",
    incidents: "Incidents",
    incidentLog: "Incident log",
    prepare: "Prepare",
    reports: "Reports",
    weeklyReports: "Weekly reports",
    dashboard: "Dashboard",
    settings: "Settings",
    add: "Add",
    readOnly: "Read-only",
  },
  crumb: {
    home: "Home",
    incidents: "Incidents",
    prepare: "Prepare",
    weeklyReports: "Weekly reports",
    dashboard: "Dashboard",
    settings: "Settings",
    users: "User access",
    detail: "Detail",
  },
  shell: {
    collapse: "Collapse",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
  },
  profile: {
    openMenu: "Open profile menu",
    settings: "Settings",
    userAccess: "User access",
    signOut: "Sign out",
  },
  locale: {
    switchToEn: "Switch to English",
    switchToTh: "Switch to Thai",
  },
  roles: {
    VISITOR: "Visitor",
    MEMBER: "Member",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
  },
  sites: {
    BANGKOK: "Bangkok",
    PHUKET: "Phuket",
  },
  entryType: {
    INCIDENT: "Incident",
    SERVICE: "Service",
    incidents: "Incidents",
    services: "Services",
  },
  severity: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  },
  home: {
    quickLogTitle: "Quick log entry",
    quickLogCanWrite:
      "Required fields are marked. Optional context can be added now or later.",
    quickLogReadOnly:
      "You can browse all sites. Ask an admin for Member access to log incidents.",
  },
  pages: {
    opsLogTitle: "Ops log",
    opsLogDescription:
      "Capture incidents and service work while the details are fresh, then search and resolve them from one place.",
    prepareTitle: "Prepare weekly report",
    prepareDescription:
      "Anonymize ops entries (incidents and services), generate a Gemini draft, then save it to your weekly reports library.",
    reportsTitle: "Weekly reports",
    reportsDescription:
      "Browse saved drafts and reviewed weekly reports covering incidents and services. Open any report to read, edit, or finalize it.",
    dashboardTitle: "Dashboard",
    dashboardDescription:
      "Review eight weeks of incident and service volume, unresolved work, and incident severity trends.",
    settingsTitle: "Settings",
    settingsDescription:
      "Export your records, check recovery coverage, and keep local credentials secure.",
    usersTitle: "User access",
    usersDescription:
      "Promote visitors to Member with a home site, or grant Admin. Visitors remain read-only.",
  },
  mobileAdd: {
    title: "Log an entry",
    description: "Capture the essentials now. You can resolve it later.",
    close: "Close entry form",
  },
  ledger: {
    title: "Ledger",
    newestIncidents: "Newest incidents appear first.",
    newestServices: "Newest service entries appear first.",
    shown: "{count} shown",
    searchPlaceholder: "Search title, description, or system area…",
    searchAria: "Search entries",
    filters: "Filters",
    allSeverities: "All severities",
    allSites: "All sites",
    allSystemAreas: "All system areas",
    allTags: "All tags",
    clear: "Clear",
    activeFilters: "{count} active filter",
    activeFiltersPlural: "{count} active filters",
    filterHint:
      "Search is instant. Use filters to narrow by site, severity, system area, or tag.",
    unavailable: "Ledger unavailable",
    tryAgain: "Try again",
    emptyIncidents: "No incidents in this view",
    emptyServices: "No services in this view",
    emptyFiltered: "No entries match these filters. Clear one or broaden the search.",
    emptyDefault: "Log the first event to start the knowledge base.",
    resolved: "Resolved",
    loggedBy: "Logged by {name}",
    loadMore: "Load more",
    loadOlder: "Load older",
    loading: "Loading…",
  },
  form: {
    manual: "Manual",
    aiAssist: "AI assist",
    title: "Title",
    type: "Type",
    severity: "Severity",
    site: "Site",
    systemArea: "System area",
    optional: "(optional)",
    whatHappened: "What happened?",
    tags: "Tags",
    logEntry: "Log entry",
    saving: "Saving…",
    savingIncident: "Saving incident…",
    logIncident: "Log incident",
    ctrlEnter: "Press Ctrl or Cmd + Enter to save.",
    readOnlyNotice:
      "You have read-only access. Ask an admin to promote you to Member and assign a home site before logging incidents.",
    selectSystemArea: "Select system area",
    tagsHint:
      "Prefer: outage, slow, timeout, error, disconnect, login, permission, config, update, hardware, vendor, workaround, intermittent.",
  },
  dashboard: {
    metrics: "Ops metrics",
    incidents: "Incidents",
    services: "Services",
    unresolved: "Unresolved",
    acrossWeeks: "Across the last 8 weeks",
    loggedService: "Logged service work",
    stillOpen: "Still marked open",
    trendTitle: "Eight-week ops trend",
    trendDescription: "Incident volume by severity, plus service counts.",
    severityTitle: "Incident severity",
    severityDescription: "Incident count by priority (services excluded).",
    unavailable: "Dashboard unavailable",
    tryAgain: "Try again",
  },
} as const;

/** Widen leaf strings so locale files can differ by language. */
export type Dictionary = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
