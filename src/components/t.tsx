"use client";

import { useLocale } from "@/components/locale-provider";

interface TProps {
  k: string;
  params?: Record<string, string | number>;
}

/** Client text node for use inside server components. */
export function T({ k, params }: TProps): React.JSX.Element {
  const { t } = useLocale();
  return <>{t(k, params)}</>;
}
