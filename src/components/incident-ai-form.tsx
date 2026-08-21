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
import { useLocale } from "@/components/locale-provider";
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
import { toast } from "@/components/ui/toast";
import {
  initialIncidentActionState,
  initialIncidentDraftState,
  entryTypeValues,
  severityValues,
  type EntryTypeValue,
  type IncidentActionState,
  type IncidentDraft,
} from "@/lib/incidents";
import { writableSitesFor } from "@/lib/permissions";
import { siteValues, type SiteValue } from "@/lib/sites";
import { useCurrentAuthUser } from "@/lib/use-current-auth-user";
import { cn } from "@/lib/utils";

function GenerateButton({
  disabled,
}: {
  disabled: boolean;
}): React.JSX.Element {
  const { pending } = useFormStatus();
  const { t } = useLocale();

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
      {pending ? t("aiAssist.generating") : t("aiAssist.generateDraft")}
    </Button>
  );
}

function SaveButton({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const { pending } = useFormStatus();
  const { t } = useLocale();
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
      {busy ? t("aiAssist.saving") : t("aiAssist.logIncident")}
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
  const { t } = useLocale();
  const restored =
    saveState.status === "error" ? saveState.values : null;
  const title = restored?.title || draft.title;
  const description = restored?.description || draft.description;
  const tags = restored?.tags || draft.tags.join(", ");
  const systemArea = restored?.systemArea || draft.systemArea || "";
  const severityDefault =
    restored?.severity &&
    (severityValues as readonly string[]).includes(restored.severity)
      ? restored.severity
      : draft.severity;
  const siteDefault =
    restored?.site && writableSites.includes(restored.site as SiteValue)
      ? (restored.site as SiteValue)
      : draftSite;
  const [entryType, setEntryType] = useState<EntryTypeValue>(
    restored?.entryType === "SERVICE" || restored?.entryType === "INCIDENT"
      ? restored.entryType
      : initialEntryType,
  );
  const [imagesUploading, setImagesUploading] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium text-emerald-900">
          {t("aiAssist.draftReady")}
        </p>
      </div>

      <form
        key={
          saveState.status === "error"
            ? `error-${saveState.formKey}`
            : "draft"
        }
        ref={saveFormRef}
        action={saveAction}
        className="grid gap-4"
      >
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-title`}>{t("aiAssist.title")}</Label>
          <Input
            id={`${idPrefix}draft-title`}
            name="title"
            defaultValue={title}
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
            <Label htmlFor={`${idPrefix}draft-entry-type`}>
              {t("aiAssist.type")}
            </Label>
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
                    t(`entryType.${(value as EntryTypeValue) ?? "INCIDENT"}`)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {entryTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`entryType.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {entryType === "INCIDENT" && (
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}draft-severity`}>
                {t("aiAssist.severity")}
              </Label>
              <Select name="severity" defaultValue={severityDefault}>
                <SelectTrigger
                  id={`${idPrefix}draft-severity`}
                  className="h-11! w-full bg-white"
                >
                  <SelectValue>
                    {(value) => t(`severity.${(value as string) ?? "MEDIUM"}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {severityValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`severity.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}draft-site`}>{t("aiAssist.site")}</Label>
            {siteLocked ? (
              <>
                <input type="hidden" name="site" value={draftSite} />
                <Input
                  id={`${idPrefix}draft-site`}
                  value={t(`sites.${draftSite}`)}
                  readOnly
                  className="h-11 bg-slate-50"
                />
              </>
            ) : (
              <Select name="site" defaultValue={siteDefault}>
                <SelectTrigger
                  id={`${idPrefix}draft-site`}
                  className="h-11! w-full bg-white"
                >
                  <SelectValue>
                    {(value) => t(`sites.${(value as string) ?? "BANGKOK"}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {writableSites.map((site) => (
                    <SelectItem key={site} value={site}>
                      {t(`sites.${site}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-area`}>
            {t("aiAssist.systemArea")}
          </Label>
          <SystemAreaField
            id={`${idPrefix}draft-area`}
            defaultValue={systemArea}
            selectPlaceholder={t("form.selectSystemArea")}
            customPlaceholder={t("form.systemAreaPlaceholder")}
            addLabel={t("form.addCustomSystemArea")}
            listLabel={t("form.usePresetSystemArea")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-desc`}>
            {t("aiAssist.description")}
          </Label>
          <Textarea
            id={`${idPrefix}draft-desc`}
            name="description"
            defaultValue={description}
            maxLength={2_000}
            rows={5}
            required
            className="min-h-28 resize-y bg-white"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}draft-tags`}>{t("aiAssist.tags")}</Label>
          <Input
            id={`${idPrefix}draft-tags`}
            name="tags"
            defaultValue={tags}
            maxLength={250}
            className="h-11 bg-white"
          />
          <p className="text-xs text-slate-500">{t("aiAssist.tagsHint")}</p>
        </div>

        <ImageUploadField
          id={`${idPrefix}draft-photos`}
          defaultUrls={restored?.imageUrls ?? []}
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
              {t("aiAssist.startOver")}
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
  const { t } = useLocale();
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

      toast.add({
        type: "success",
        title: t("form.savedTitle"),
        description: t("form.savedDescription"),
        actionProps: {
          children: t("form.viewLedger"),
          onClick() {
            document
              .getElementById("ops-ledger")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          },
        },
      });
    }

    void resetAfterSave();
    return () => {
      cancelled = true;
    };
  }, [queryClient, saveState, t]);

  function handleStartOver(): void {
    setDraft(null);
  }

  if (writableSites.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {t("aiAssist.readOnlyNotice")}
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
          <p className="font-semibold">{t("aiAssist.removeIdentifiersTitle")}</p>
          <p className="mt-0.5 text-amber-900">
            {t("aiAssist.removeIdentifiersBody")}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}notes`}>{t("aiAssist.notesLabel")}</Label>
        <Textarea
          ref={notesRef}
          id={`${idPrefix}notes`}
          name="notes"
          placeholder={t("aiAssist.notesPlaceholder")}
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
            {t("aiAssist.confirmAnonymized")}
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
