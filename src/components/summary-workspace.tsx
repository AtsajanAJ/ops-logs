"use client";

import { useState } from "react";

import {
  SummaryGenerator,
  type DateRange,
} from "@/components/summary-generator";
import { SummaryList } from "@/components/summary-list";
import { SectionHeading } from "@/components/page-heading";
import { useLocale } from "@/components/locale-provider";

interface SummaryWorkspaceProps {
  defaultRange: DateRange;
}

export function SummaryWorkspace({
  defaultRange,
}: SummaryWorkspaceProps): React.JSX.Element {
  const [activeRange, setActiveRange] = useState(defaultRange);
  const { t } = useLocale();

  return (
    <div className="grid gap-12">
      <section aria-label={t("summaries.prepareSectionAria")}>
        <SectionHeading
          title={t("summaries.prepareSectionTitle")}
          description={t("summaries.prepareSectionDescription")}
          className="mb-5"
        />
        <SummaryGenerator
          defaultRange={defaultRange}
          onRangePrepared={setActiveRange}
        />
      </section>

      <section aria-label={t("summaries.reviewSectionAria")}>
        <SectionHeading
          title={t("summaries.reviewSectionTitle")}
          description={t("summaries.reviewSectionDescription")}
          className="mb-5"
        />
        <SummaryList range={activeRange} />
      </section>
    </div>
  );
}
