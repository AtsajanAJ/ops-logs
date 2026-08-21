"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LoaderCircle,
  Plus,
  RotateCcw,
  ShieldAlert,
  WandSparkles,
} from "lucide-react";

import {
  createIncident,
  draftIncidentFromNotes,
} from "@/app/actions/incidents";
import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { SystemAreaField } from "@/components/system-area-field";
import {
  initialIncidentActionState,
  initialIncidentDraftState,
  entryTypeLabels,
  entryTypeValues,
  severityLabels,
  severityValues,
  type EntryTypeValue,
  type IncidentActionState,
  type IncidentDraft,
} from "@/lib/incidents";
import { writableSitesFor } from "@/lib/permissions";
import { siteLabels, siteValues, type SiteValue } from "@/lib/sites";
import { useCurrentAuthUser } from "@/lib/use-current-auth-user";
import { cn } from "@/lib/utils";

const severityFallback = severityLabels.MEDIUM;

function GenerateButton({
  disabled,
}: {
  disabled: boolean;
}): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || pending}
      className="h-11 w-full bg-slate-950 px-5 text-white hover:bg-slate-800 sm:w-auto"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <WandSparkles aria-hidden="true" />
      )}
      {pending ? "Generating…" : "Generate draft"}
    </Button>
  );
}

function SaveButton({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const { pending } = useFormStatus();
  const busy = pending || disabled;

  return (
    <Button
      type="submit"
      size="lg"
      disabled={busy}
      className="h-11 w-full bg-slate-950 px-5 text-white hover:bg-slate-800 sm:w-auto"
    >
      {busy ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <Plus aria-hidden="true" />
      )}
      {busy ? "Saving…" : "Log incident"}
    </Button>
  );
}

interface AiDraftFormProps {
  idPrefix: string;
  draft: IncidentDraft;
  draftSite: SiteValue;
  initialEntryType: EntryTypeValue;
  siteLocked: boolean;
  writableSites: SiteValue[];
  saveAction: (payload: FormData) => void;
  saveState: IncidentActionState;
  onStartOver: () => void;
  saveFormRef: React.RefObject<HTMLFormElement | null>;
}

function AiDraftForm({
  idPrefix,
  draft,
  draftSite,
  initialEntryType,
  siteLocked,
  writableSites,
  saveAction,
  saveState,
  onStartOver,
  saveFormRef,
}: AiDraftFormProps): React.JSX.Element {
  const [entryType, setEntryType] = useState<EntryTypeValue>(initialEntryType);
  const [imagesUploading, setImagesUploading] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium text-emerald-900">
          AI draft ready — review and edit before saving.
        </p>
      </div>

      <form ref={saveFormRef} action={saveAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-title`}>Title</Label>
          <Input
            id={`${idPrefix}draft-title`}
            name="title"
            defaultValue={draft.title}
            maxLength={120}
            required
            className="h-11 bg-white"
          />
        </div>

        <div
          className={cn(
            "grid gap-4",
            entryType === "SERVICE" ? "sm:grid-cols-2" : "sm:grid-cols-3",
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}draft-entry-type`}>Type</Label>
            <Select
              name="entryType"
              value={entryType}
              onValueChange={(value) =>
                setEntryType((value as EntryTypeValue | null) ?? "INCIDENT")
              }
            >
              <SelectTrigger
                id={`${idPrefix}draft-entry-type`}
                className="h-11! w-full bg-white"
              >
                <SelectValue>
                  {(value) =>
                    entryTypeLabels[value as keyof typeof entryTypeLabels] ??
                    entryTypeLabels.INCIDENT
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {entryTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {entryTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {entryType === "INCIDENT" && (
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}draft-severity`}>Severity</Label>
              <Select name="severity" defaultValue={draft.severity}>
                <SelectTrigger
                  id={`${idPrefix}draft-severity`}
                  className="h-11! w-full bg-white"
                >
                  <SelectValue>
                    {(value) =>
                      severityLabels[value as keyof typeof severityLabels] ??
                      severityFallback
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {severityValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {severityLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}draft-site`}>Site</Label>
            {siteLocked ? (
              <>
                <input type="hidden" name="site" value={draftSite} />
                <Input
                  id={`${idPrefix}draft-site`}
                  value={siteLabels[draftSite]}
                  readOnly
                  className="h-11 bg-slate-50"
                />
              </>
            ) : (
              <Select name="site" defaultValue={draftSite}>
                <SelectTrigger
                  id={`${idPrefix}draft-site`}
                  className="h-11! w-full bg-white"
                >
                  <SelectValue>
                    {(value) =>
                      siteLabels[value as keyof typeof siteLabels] ??
                      siteLabels.BANGKOK
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {writableSites.map((site) => (
                    <SelectItem key={site} value={site}>
                      {siteLabels[site]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-area`}>System area</Label>
          <SystemAreaField
            id={`${idPrefix}draft-area`}
            defaultValue={draft.systemArea}
            selectPlaceholder="Select system area"
            customPlaceholder="Type a custom system…"
            addLabel="Add custom system"
            listLabel="Back to system list"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-desc`}>Description</Label>
          <Textarea
            id={`${idPrefix}draft-desc`}
            name="description"
            defaultValue={draft.description}
            maxLength={2_000}
            rows={5}
            required
            className="min-h-28 resize-y bg-white"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-tags`}>Tags</Label>
          <Input
            id={`${idPrefix}draft-tags`}
            name="tags"
            defaultValue={draft.tags.join(", ")}
            maxLength={250}
            className="h-11 bg-white"
          />
          <p className="text-xs text-slate-500">
            Separate up to 8 tags with commas. Prefer: outage, slow, timeout,
            error, disconnect, login, permission, config, update, hardware,
            vendor, workaround, intermittent.
          </p>
        </div>

        <ImageUploadField
          id={`${idPrefix}draft-photos`}
          onUploadingChange={setImagesUploading}
        />

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onStartOver}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Start over
            </button>
            {saveState.message && (
              <p
                aria-live="polite"
                className={
                  saveState.status === "error"
                    ? "text-sm font-medium text-red-700"
                    : "text-sm font-medium text-emerald-700"
                }
              >
                {saveState.message}
              </p>
            )}
          </div>
          <SaveButton disabled={imagesUploading} />
        </div>
      </form>
    </div>
  );
}

interface IncidentAiFormProps {
  idPrefix?: string;
}

export function IncidentAiForm({
  idPrefix = "ai-",
}: IncidentAiFormProps): React.JSX.Element {
  const [confirmed, setConfirmed] = useState(false);
  const [draft, setDraft] = useState<IncidentDraft | null>(null);

  const [draftState, draftAction] = useActionState(
    draftIncidentFromNotes,
    initialIncidentDraftState,
  );

  const [saveState, saveAction] = useActionState(
    createIncident,
    initialIncidentActionState,
  );

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const saveFormRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const { user } = useCurrentAuthUser();
  const writableSites = user ? writableSitesFor(user) : [];
  const defaultSite = writableSites[0] ?? "BANGKOK";
  const siteLocked = writableSites.length === 1;

  useEffect(() => {
    if (draftState.status !== "success" || !draftState.draft) return;

    let cancelled = false;
    const nextDraft = draftState.draft;

    async function applyDraft() {
      await Promise.resolve();
      if (!cancelled) setDraft(nextDraft);
    }

    void applyDraft();
    return () => {
      cancelled = true;
    };
  }, [draftState]);

  useEffect(() => {
    if (saveState.status !== "success") return;

    let cancelled = false;

    async function resetAfterSave() {
      await Promise.resolve();
      if (cancelled) return;
      setDraft(null);
      setConfirmed(false);
      if (notesRef.current) notesRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: ["incidents"] });
    }

    void resetAfterSave();
    return () => {
      cancelled = true;
    };
  }, [queryClient, saveState]);

  function handleStartOver(): void {
    setDraft(null);
  }

  if (writableSites.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        You have read-only access. Ask an admin to promote you to Member and
        assign a home site before using AI assist.
      </div>
    );
  }

  if (draft) {
    const draftSite =
      draft.site &&
      siteValues.includes(draft.site) &&
      writableSites.includes(draft.site)
        ? draft.site
        : defaultSite;

    return (
      <AiDraftForm
        idPrefix={idPrefix}
        draft={draft}
        draftSite={draftSite}
        initialEntryType={draft.entryType ?? "INCIDENT"}
        siteLocked={siteLocked}
        writableSites={writableSites}
        saveAction={saveAction}
        saveState={saveState}
        onStartOver={handleStartOver}
        saveFormRef={saveFormRef}
      />
    );
  }

  return (
    <form action={draftAction} className="grid gap-4">
      <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Remove real identifiers first</p>
          <p className="mt-0.5 text-amber-900">
            Don&apos;t include real hospital, patient, or client names — use
            generic labels like &quot;Site A&quot; or &quot;Client B&quot;.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}notes`}>What happened?</Label>
        <Textarea
          ref={notesRef}
          id={`${idPrefix}notes`}
          name="notes"
          placeholder="Describe the problem briefly — AI will structure it into a proper incident log entry."
          maxLength={2_000}
          rows={5}
          required
          className="min-h-28 resize-y bg-white"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={`${idPrefix}confirm`}
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(Boolean(checked))}
            className="mt-0.5"
          />
          <input
            type="hidden"
            name="confirmedAnonymized"
            value={confirmed ? "true" : "false"}
          />
          <Label
            htmlFor={`${idPrefix}confirm`}
            className="cursor-pointer text-sm leading-6 font-normal text-slate-700"
          >
            I confirm this text contains no real patient, hospital, or client
            identifiers.
          </Label>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5">
          {draftState.message && (
            <p
              aria-live="polite"
              className={
                draftState.status === "error"
                  ? "text-sm font-medium text-red-700"
                  : "text-sm font-medium text-emerald-700"
              }
            >
              {draftState.message}
            </p>
          )}
        </div>
        <GenerateButton disabled={!confirmed} />
      </div>
    </form>
  );
}
