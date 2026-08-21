"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, PenLine, Plus, WandSparkles } from "lucide-react";

import { createIncident } from "@/app/actions/incidents";
import { ImageUploadField } from "@/components/image-upload-field";
import { IncidentAiForm } from "@/components/incident-ai-form";
import { SystemAreaField } from "@/components/system-area-field";
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
  entryTypeValues,
  severityValues,
  type EntryTypeValue,
  type IncidentActionState,
  type IncidentFormValues,
} from "@/lib/incidents";
import { writableSitesFor } from "@/lib/permissions";
import { useCurrentAuthUser } from "@/lib/use-current-auth-user";
import { useLocale } from "@/components/locale-provider";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { SiteValue } from "@/lib/sites";

function SubmitButton({
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
      {busy ? t("form.savingIncident") : t("form.logIncident")}
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

function resolveEntryType(value: string | undefined): EntryTypeValue {
  return value === "SERVICE" ? "SERVICE" : "INCIDENT";
}

interface ManualFormFieldsProps {
  idPrefix: string;
  state: IncidentActionState;
  formAction: (payload: FormData) => void;
  values: IncidentFormValues;
  writableSites: SiteValue[];
  defaultSite: SiteValue;
  siteLocked: boolean;
}

function ManualFormFields({
  idPrefix,
  state,
  formAction,
  values,
  writableSites,
  defaultSite,
  siteLocked,
}: ManualFormFieldsProps): React.JSX.Element {
  const [entryType, setEntryType] = useState<EntryTypeValue>(
    resolveEntryType(values.entryType),
  );
  const [imagesUploading, setImagesUploading] = useState(false);
  const { t } = useLocale();
  const titleId = `${idPrefix}title`;
  const titleErrorId = `${idPrefix}title-error`;
  const entryTypeId = `${idPrefix}entry-type`;
  const severityId = `${idPrefix}severity`;
  const siteId = `${idPrefix}site`;
  const systemAreaId = `${idPrefix}system-area`;
  const descriptionId = `${idPrefix}description`;
  const tagsId = `${idPrefix}tags`;
  const siteDefault =
    values.site && writableSites.includes(values.site as SiteValue)
      ? (values.site as SiteValue)
      : defaultSite;
  const severityDefault =
    values.severity &&
    (severityValues as readonly string[]).includes(values.severity)
      ? values.severity
      : "LOW";

  return (
    <form
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
          {t("form.title")}{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id={titleId}
          name="title"
          defaultValue={values.title}
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

      <div
        className={cn(
          "grid gap-4",
          entryType === "SERVICE" ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        <div className="grid gap-2">
          <Label htmlFor={entryTypeId}>
            {t("form.type")}{" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
          </Label>
          <Select
            name="entryType"
            value={entryType}
            onValueChange={(value) =>
              setEntryType((value as EntryTypeValue | null) ?? "INCIDENT")
            }
          >
            <SelectTrigger
              id={entryTypeId}
              className="h-11! w-full bg-white"
              aria-invalid={Boolean(state.fieldErrors.entryType)}
            >
              <SelectValue>
                {(value) => t(`entryType.${value as EntryTypeValue}`)}
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
          <FieldError message={state.fieldErrors.entryType} />
        </div>

        {entryType === "INCIDENT" && (
          <div className="grid gap-2">
            <Label htmlFor={severityId}>
              {t("form.severity")}{" "}
              <span className="text-red-600" aria-hidden="true">
                *
              </span>
            </Label>
            <Select name="severity" defaultValue={severityDefault}>
              <SelectTrigger
                id={severityId}
                className="h-11! w-full bg-white"
                aria-invalid={Boolean(state.fieldErrors.severity)}
              >
                <SelectValue>
                  {(value) => t(`severity.${value as string}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {severityValues.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {t(`severity.${severity}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={state.fieldErrors.severity} />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor={siteId}>
            {t("form.site")}{" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
          </Label>
          {siteLocked ? (
            <>
              <input type="hidden" name="site" value={defaultSite} />
              <Input
                id={siteId}
                value={t(`sites.${defaultSite}`)}
                readOnly
                className="h-11 bg-slate-50"
              />
            </>
          ) : (
            <Select name="site" defaultValue={siteDefault}>
              <SelectTrigger
                id={siteId}
                className="h-11! w-full bg-white"
                aria-invalid={Boolean(state.fieldErrors.site)}
              >
                <SelectValue>
                  {(value) => t(`sites.${value as string}`)}
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
          <FieldError message={state.fieldErrors.site} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={systemAreaId}>
          {t("form.systemArea")}{" "}
          <span className="font-normal text-slate-500">
            {t("form.optional")}
          </span>
        </Label>
        <SystemAreaField
          id={systemAreaId}
          defaultValue={values.systemArea}
          invalid={Boolean(state.fieldErrors.systemArea)}
          selectPlaceholder={t("form.selectSystemArea")}
          customPlaceholder={t("form.systemAreaPlaceholder")}
          addLabel={t("form.addCustomSystemArea")}
          listLabel={t("form.usePresetSystemArea")}
        />
        <FieldError message={state.fieldErrors.systemArea} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={descriptionId}>
          {t("form.whatHappened")}{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id={descriptionId}
          name="description"
          defaultValue={values.description}
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
          {t("form.tags")}{" "}
          <span className="font-normal text-slate-500">
            {t("form.optional")}
          </span>
        </Label>
        <Input
          id={tagsId}
          name="tags"
          defaultValue={values.tags}
          placeholder="vpn, outage, timeout"
          maxLength={250}
          aria-invalid={Boolean(state.fieldErrors.tags)}
          className="h-11 bg-white"
        />
        <p className="text-xs text-slate-500">{t("form.tagsHint")}</p>
        <FieldError message={state.fieldErrors.tags} />
      </div>

      <ImageUploadField
        id={`${idPrefix}photos`}
        defaultUrls={values.imageUrls}
        onUploadingChange={setImagesUploading}
      />

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
            <p className="text-xs text-slate-500">{t("form.ctrlEnter")}</p>
          )}
        </div>
        <SubmitButton disabled={imagesUploading} />
      </div>
    </form>
  );
}

function ManualForm({ idPrefix }: { idPrefix: string }): React.JSX.Element {
  const [state, formAction] = useActionState(
    createIncident,
    initialIncidentActionState,
  );
  const queryClient = useQueryClient();
  const { user } = useCurrentAuthUser();
  const writableSites = user ? writableSitesFor(user) : [];
  const defaultSite = writableSites[0] ?? "BANGKOK";
  const siteLocked = writableSites.length === 1;
  const { t } = useLocale();

  useEffect(() => {
    if (state.status !== "success") return;

    let cancelled = false;

    async function refreshAfterSave() {
      await Promise.resolve();
      if (cancelled) return;

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

    void refreshAfterSave();
    return () => {
      cancelled = true;
    };
  }, [queryClient, state, t]);

  if (writableSites.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {t("form.readOnlyNotice")}
      </div>
    );
  }

  return (
    <ManualFormFields
      key={state.formKey}
      idPrefix={idPrefix}
      state={state}
      formAction={formAction}
      values={state.values}
      writableSites={writableSites}
      defaultSite={defaultSite}
      siteLocked={siteLocked}
    />
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
  const { t } = useLocale();

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
          {t("form.manual")}
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
          {t("form.aiAssist")}
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
