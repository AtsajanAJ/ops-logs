"use client";

import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function LocaleToggle(): React.JSX.Element {
  const { locale, toggleLocale, t } = useLocale();
  const nextLabel = locale === "th" ? "EN" : "TH";
  const ariaLabel =
    locale === "th" ? t("locale.switchToEn") : t("locale.switchToTh");

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "fixed right-4 z-50 flex size-12 items-center justify-center rounded-full",
        "border border-slate-200 bg-white text-sm font-semibold tracking-wide text-slate-950",
        "shadow-[0_8px_24px_rgba(15,23,42,0.14)] transition-[transform,box-shadow] duration-200",
        "hover:scale-105 hover:shadow-[0_10px_28px_rgba(15,23,42,0.18)]",
        "focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:outline-none",
        "active:scale-95",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6",
      )}
    >
      {nextLabel}
    </button>
  );
}
