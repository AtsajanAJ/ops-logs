export type Locale = "en" | "th";

export const LOCALES: Locale[] = ["en", "th"];

export const DEFAULT_LOCALE: Locale = "th";

export const LOCALE_STORAGE_KEY = "ops-logs-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "th";
}
