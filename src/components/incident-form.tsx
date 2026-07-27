"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus } from "lucide-react";

import { createIncident } from "@/app/actions/incidents";
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
  severityValues,
} from "@/lib/incidents";

const severityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
} as const;

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

export function IncidentForm(): React.JSX.Element {
  const [state, formAction] = useActionState(
    createIncident,
    initialIncidentActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state.status !== "success") return;

    formRef.current?.reset();
    void queryClient.invalidateQueries({ queryKey: ["incidents"] });
  }, [queryClient, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-5"
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="title">Incident title</Label>
        <Input
          id="title"
          name="title"
          placeholder="VPN access failed after update"
          maxLength={120}
          autoFocus
          aria-invalid={Boolean(state.fieldErrors.title)}
          aria-describedby={state.fieldErrors.title ? "title-error" : undefined}
          className="h-11 bg-white"
        />
        <div id="title-error">
          <FieldError message={state.fieldErrors.title} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="severity">Severity</Label>
          <Select name="severity" defaultValue="LOW">
            <SelectTrigger
              id="severity"
              className="h-11! w-full bg-white"
              aria-invalid={Boolean(state.fieldErrors.severity)}
            >
              <SelectValue>
                {(value) =>
                  severityLabels[value as keyof typeof severityLabels] ?? "Low"
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
          <Label htmlFor="systemArea">System area</Label>
          <Input
            id="systemArea"
            name="systemArea"
            placeholder="Network, PACS, access"
            maxLength={80}
            aria-invalid={Boolean(state.fieldErrors.systemArea)}
            className="h-11 bg-white"
          />
          <FieldError message={state.fieldErrors.systemArea} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">What happened?</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Record the symptoms, impact, and what you tried."
          maxLength={2_000}
          rows={5}
          aria-invalid={Boolean(state.fieldErrors.description)}
          className="min-h-28 resize-y bg-white"
        />
        <FieldError message={state.fieldErrors.description} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="vpn, access, update"
          maxLength={250}
          aria-invalid={Boolean(state.fieldErrors.tags)}
          className="h-11 bg-white"
        />
        <p className="text-xs text-slate-500">Separate up to 8 tags with commas.</p>
        <FieldError message={state.fieldErrors.tags} />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
        <SubmitButton />
      </div>
    </form>
  );
}
