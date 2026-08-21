"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Trash2 } from "lucide-react";

import { deleteSummaryDraft } from "@/app/actions/summaries";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  initialSummaryActionState,
  type SummaryView,
} from "@/lib/summaries";

function DeleteSubmitButton(): React.JSX.Element {
  const { pending } = useFormStatus();
  const { t } = useLocale();

  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      disabled={pending}
      className="h-11 sm:h-9"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
      {pending ? t("summaries.deleting") : t("summaries.deleteDraft")}
    </Button>
  );
}

interface SummaryDeleteDialogProps {
  summary: SummaryView;
  onSuccess?: () => void;
}

export function SummaryDeleteDialog({
  summary,
  onSuccess,
}: SummaryDeleteDialogProps): React.JSX.Element {
  const [state, formAction] = useActionState(
    deleteSummaryDraft,
    initialSummaryActionState,
  );
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(
    locale === "th" ? "th-TH" : "en",
    { dateStyle: "medium" },
  );
  const onSuccessRef = useRef(onSuccess);
  const rangeLabel = `${dateFormatter.format(new Date(summary.weekStart))} – ${dateFormatter.format(new Date(summary.weekEnd))}`;

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status !== "success") return;

    let cancelled = false;

    async function notifyDeleted() {
      await Promise.resolve();
      if (cancelled) return;
      void queryClient.invalidateQueries({ queryKey: ["summaries"] });
      void queryClient.invalidateQueries({ queryKey: ["summary-draft-count"] });
      toast.add({
        type: "success",
        title: t("toast.summaryDeletedTitle"),
        description: t("toast.summaryDeletedDescription"),
      });
      onSuccessRef.current?.();
    }

    void notifyDeleted();
    return () => {
      cancelled = true;
    };
  }, [queryClient, state.status, t]);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-11 px-3 text-slate-500 hover:bg-red-50 hover:text-red-700 sm:h-9"
            aria-label={`${t("summaries.deleteDraft")} ${rangeLabel}`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
        {t("summaries.deleteDraft")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("summaries.deleteDraftTitle")}</DialogTitle>
          <DialogDescription>
            {t("summaries.deleteDraftDescriptionPrefix")}{" "}
            <span className="font-medium text-slate-700">{rangeLabel}</span>.{" "}
            {t("summaries.deleteDraftDescriptionSuffix")}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <input type="hidden" name="id" value={summary.id} />
          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" size="sm" />}
            >
              {t("summaries.cancel")}
            </DialogClose>
            <DeleteSubmitButton />
          </DialogFooter>
        </form>

        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-sm font-medium text-red-700"
              : "text-sm font-medium text-emerald-700"
          }
        >
          {state.message}
        </p>
      </DialogContent>
    </Dialog>
  );
}
