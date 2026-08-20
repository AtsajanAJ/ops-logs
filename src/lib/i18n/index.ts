import { en, type Dictionary } from "./en";
import { th } from "./th";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  th,
};

export type MessageKey = LeaveLeaves<Dictionary>;

type LeaveLeaves<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : {
      [K in keyof T & string]: LeaveLeaves<
        T[K],
        Prefix extends "" ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function translate(
  dictionary: Dictionary,
  key: string,
  params?: Record<string, string | number>,
): string {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);

  if (typeof value !== "string") {
    return key;
  }

  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] === undefined ? `{${name}}` : String(params[name]),
  );
}
