"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";

import {
  reopenIncident,
  resolveIncident,
} from "@/app/actions/incidents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  initialIncidentLifecycleState,
  type IncidentView,
} from "@/lib/incidents";

function LifecycleSubmitButton({
  resolved,
}: {
  resolved: boolean;
}): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      className={
        resolved
          ? "bg-slate-700 text-white hover:bg-slate-800"
          : "bg-emerald-700 text-white hover:bg-emerald-800"
      }
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : resolved ? (
        <RotateCcw aria-hidden="true" />
      ) : (
        <CheckCircle2 aria-hidden="true" />
      )}
      {pending ? "Saving…" : resolved ? "Reopen incident" : "Mark resolved"}
    </Button>
  );
}

interface IncidentLifecycleDialogProps {
  incident: IncidentView;
}

export function IncidentLifecycleDialog({
  incident,
}: IncidentLifecycleDialogProps): React.JSX.Element {
  const [resolveState, resolveAction] = useActionState(
    resolveIncident,
    initialIncidentLifecycleState,
  );
  const [reopenState, reopenAction] = useActionState(
    reopenIncident,
    initialIncidentLifecycleState,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      resolveState.status !== "success" &&
      reopenState.status !== "success"
    ) {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["incidents"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient, reopenState.status, resolveState.status]);

  const state = reopenState.status !== "idle" ? reopenState : resolveState;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="xs"
            variant={incident.resolved ? "outline" : "secondary"}
          />
        }
      >
        {incident.resolved ? "Resolution" : "Resolve"}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {incident.resolved ? "Resolution record" : "Resolve incident"}
          </DialogTitle>
          <DialogDescription>{incident.title}</DialogDescription>
        </DialogHeader>

        {incident.resolved ? (
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Root cause
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {incident.rootCause || "Not yet determined"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Resolution
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {incident.resolution}
              </p>
            </div>
            <form action={reopenAction}>
              <input type="hidden" name="id" value={incident.id} />
              <DialogFooter className="mt-2">
                <LifecycleSubmitButton resolved />
              </DialogFooter>
            </form>
          </div>
        ) : (
          <form action={resolveAction} className="grid gap-4">
            <input type="hidden" name="id" value={incident.id} />
            <div className="grid gap-2">
              <Label htmlFor={`root-cause-${incident.id}`}>
                Root cause <span className="text-slate-400">(optional)</span>
              </Label>
              <Textarea
                id={`root-cause-${incident.id}`}
                name="rootCause"
                defaultValue={incident.rootCause ?? ""}
                placeholder="What caused the incident?"
                rows={4}
                maxLength={2_000}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`resolution-${incident.id}`}>Resolution</Label>
              <Textarea
                id={`resolution-${incident.id}`}
                name="resolution"
                defaultValue={incident.resolution ?? ""}
                placeholder="What restored service or closed the issue?"
                rows={5}
                maxLength={2_000}
                required
              />
            </div>
            <DialogFooter>
              <LifecycleSubmitButton resolved={false} />
            </DialogFooter>
          </form>
        )}

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
