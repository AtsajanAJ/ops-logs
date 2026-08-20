"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, PenLine, Plus, WandSparkles } from "lucide-react";

import { createIncident } from "@/app/actions/incidents";
import { IncidentAiForm } from "@/components/incident-ai-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  initialIncidentActionState,
  severityLabels,
  severityValues,
  SYSTEM_AREAS,
} from "@/lib/incidents";
import { cn } from "@/lib/utils";

function SubmitButton(): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-11 w-full bg-slate-950 px-5 text-white hover:bg-slate-800 sm:w-auto"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <Plus aria-hidden="true" />
      )}
      {pending ? "Saving incident…" : "Log incident"}
    </Button>
  );
}

interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps): React.JSX.Element | null {
  if (!message) return null;

  return (
    <p className="text-xs font-medium text-red-700" role="alert">
      {message}
    </p>
  );
}

function ManualForm({ idPrefix }: { idPrefix: string }): React.JSX.Element {
  const [state, formAction] = useActionState(
    createIncident,
    initialIncidentActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const titleId = `${idPrefix}title`;
  const titleErrorId = `${idPrefix}title-error`;
  const severityId = `${idPrefix}severity`;
  const systemAreaId = `${idPrefix}system-area`;
  const descriptionId = `${idPrefix}description`;
  const tagsId = `${idPrefix}tags`;

  useEffect(() => {
    if (state.status !== "success") return;

    formRef.current?.reset();
    void queryClient.invalidateQueries({ queryKey: ["incidents"] });
  }, [queryClient, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4"
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key === "Enter" &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault();
          event.currentTarget.requestSubmit();
        }
      }}
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor={titleId}>
          Incident title <span className="text-red-600" aria-hidden="true">*</span>
        </Label>
        <Input
          id={titleId}
          name="title"
          placeholder="VPN access failed after update"
          maxLength={120}
          autoFocus
          required
          aria-invalid={Boolean(state.fieldErrors.title)}
          aria-describedby={state.fieldErrors.title ? titleErrorId : undefined}
          className="h-11 bg-white"
        />
        <div id={titleErrorId}>
          <FieldError message={state.fieldErrors.title} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={severityId}>
            Severity <span className="text-red-600" aria-hidden="true">*</span>
          </Label>
          <Select name="severity" defaultValue="LOW">
            <SelectTrigger
              id={severityId}
              className="h-11! w-full bg-white"
              aria-invalid={Boolean(state.fieldErrors.severity)}
            >
              <SelectValue>
                {(value) =>
                  severityLabels[value as keyof typeof severityLabels] ??
                  severityLabels.LOW
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {severityValues.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severityLabels[severity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={state.fieldErrors.severity} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={systemAreaId}>
            System area <span className="font-normal text-slate-500">(optional)</span>
          </Label>
          <Select name="systemArea">
            <SelectTrigger
              id={systemAreaId}
              className="h-11! w-full bg-white"
              aria-invalid={Boolean(state.fieldErrors.systemArea)}
            >
              <SelectValue placeholder="Select system area">
                {(value) => (value ? String(value) : "Select system area")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={state.fieldErrors.systemArea} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={descriptionId}>
          What happened? <span className="text-red-600" aria-hidden="true">*</span>
        </Label>
        <Textarea
          id={descriptionId}
          name="description"
          placeholder="Record the symptoms, impact, and what you tried."
          maxLength={2_000}
          rows={5}
          required
          aria-invalid={Boolean(state.fieldErrors.description)}
          className="min-h-28 resize-y bg-white"
        />
        <FieldError message={state.fieldErrors.description} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={tagsId}>
          Tags <span className="font-normal text-slate-500">(optional)</span>
        </Label>
        <Input
          id={tagsId}
          name="tags"
          placeholder="vpn, outage, timeout"
          maxLength={250}
          aria-invalid={Boolean(state.fieldErrors.tags)}
          className="h-11 bg-white"
        />
        <p className="text-xs text-slate-500">
          Prefer: outage, slow, timeout, error, disconnect, login, permission,
          config, update, hardware, vendor, workaround, intermittent.
        </p>
        <FieldError message={state.fieldErrors.tags} />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5">
          <div
            aria-live="polite"
            className={
              state.status === "error"
                ? "text-sm font-medium text-red-700"
                : "text-sm font-medium text-emerald-700"
            }
          >
            {state.message}
          </div>
          {!state.message && (
            <p className="text-xs text-slate-500">
              Press Ctrl or Cmd + Enter to save.
            </p>
          )}
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}

type Mode = "manual" | "ai";

interface IncidentFormProps {
  idPrefix?: string;
}

export function IncidentForm({
  idPrefix = "",
}: IncidentFormProps): React.JSX.Element {
  const [mode, setMode] = useState<Mode>("manual");

  return (
    <div className="grid gap-5">
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            mode === "manual"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950",
          )}
        >
          <PenLine aria-hidden="true" className="size-3.5" />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            mode === "ai"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950",
          )}
        >
          <WandSparkles aria-hidden="true" className="size-3.5" />
          AI assist
        </button>
      </div>

      {mode === "manual" ? (
        <ManualForm idPrefix={idPrefix} />
      ) : (
        <IncidentAiForm idPrefix={`${idPrefix}ai-`} />
      )}
    </div>
  );
}
