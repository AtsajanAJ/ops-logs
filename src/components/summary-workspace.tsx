"use client";

import { useState } from "react";

import {
  SummaryGenerator,
  type DateRange,
} from "@/components/summary-generator";
import { SummaryList } from "@/components/summary-list";

interface SummaryWorkspaceProps {
  defaultRange: DateRange;
}

export function SummaryWorkspace({
  defaultRange,
}: SummaryWorkspaceProps): React.JSX.Element {
  const [activeRange, setActiveRange] = useState(defaultRange);

  return (
    <div className="grid gap-12">
      <section aria-labelledby="generate-report-title">
        <div className="mb-5">
          <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Step 01 · Protect and prepare
          </p>
          <h2
            id="generate-report-title"
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
          >
            Generate a weekly draft
          </h2>
        </div>
        <SummaryGenerator
          defaultRange={defaultRange}
          onRangePrepared={setActiveRange}
        />
      </section>

      <section aria-labelledby="report-drafts-title">
        <div className="mb-5">
          <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Step 02 · Edit and confirm
          </p>
          <h2
            id="report-drafts-title"
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
          >
            Report drafts
          </h2>
        </div>
        <SummaryList range={activeRange} />
      </section>
    </div>
  );
}
