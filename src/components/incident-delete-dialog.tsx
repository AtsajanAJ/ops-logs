"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Trash2 } from "lucide-react";

import { deleteIncident } from "@/app/actions/incidents";
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
  initialIncidentLifecycleState,
  type IncidentView,
} from "@/lib/incidents";

function DeleteSubmitButton(): React.JSX.Element {
  const { pending } = useFormStatus();
  const { t } = useLocale();

  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      disabled={pending}
      className="h-11 sm:h-8"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
      {pending ? t("lifecycle.deleting") : t("lifecycle.deleteIncident")}
    </Button>
  );
}

interface IncidentDeleteDialogProps {
  incident: IncidentView;
}

export function IncidentDeleteDialog({
  incident,
}: IncidentDeleteDialogProps): React.JSX.Element {
  const [state, formAction] = useActionState(
    deleteIncident,
    initialIncidentLifecycleState,
  );
  const queryClient = useQueryClient();
  const { t } = useLocale();

  useEffect(() => {
    if (state.status !== "success") return;

    let cancelled = false;

    async function notifyDeleted() {
      await Promise.resolve();
      if (cancelled) return;
      void queryClient.invalidateQueries({ queryKey: ["incidents"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["incident-facets"] });
      toast.add({
        type: "success",
        title: t("toast.incidentDeletedTitle"),
        description: t("toast.incidentDeletedDescription"),
      });
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
            size="xs"
            variant="ghost"
            className="h-11 px-3 text-slate-500 hover:bg-red-50 hover:text-red-700 sm:h-8"
            aria-label={t("lifecycle.deleteAria", { title: incident.title })}
          />
        }
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
        <span className="sm:sr-only">{t("lifecycle.deleteIncident")}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("lifecycle.deleteTitle")}</DialogTitle>
          <DialogDescription>
            {t("lifecycle.deleteDescriptionPrefix")}{" "}
            <span className="font-medium text-slate-700">{incident.title}</span>{" "}
            {t("lifecycle.deleteDescriptionSuffix")}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <input type="hidden" name="id" value={incident.id} />
          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" size="sm" />}
            >
              {t("lifecycle.cancel")}
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
