"use client";

import { useState } from "react";

import {
  SummaryGenerator,
  type DateRange,
} from "@/components/summary-generator";
import { SummaryList } from "@/components/summary-list";
import { SectionHeading } from "@/components/page-heading";

interface SummaryWorkspaceProps {
  defaultRange: DateRange;
}

export function SummaryWorkspace({
  defaultRange,
}: SummaryWorkspaceProps): React.JSX.Element {
  const [activeRange, setActiveRange] = useState(defaultRange);

  return (
    <div className="grid gap-12">
      <section aria-label="Prepare safe report data">
        <SectionHeading
          title="Prepare safe data"
          description="Choose a week and verify every field before anything is sent to Gemini."
          className="mb-5"
        />
        <SummaryGenerator
          defaultRange={defaultRange}
          onRangePrepared={setActiveRange}
        />
      </section>

      <section aria-label="Review report drafts">
        <SectionHeading
          title="Review drafts"
          description="Edit generated reports, save changes, and mark the final version as reviewed."
          className="mb-5"
        />
        <SummaryList range={activeRange} />
      </section>
    </div>
  );
}
