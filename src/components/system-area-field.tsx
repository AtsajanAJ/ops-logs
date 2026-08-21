"use client";

import { useState } from "react";
import { List, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYSTEM_AREAS } from "@/lib/incidents";

interface SystemAreaFieldProps {
  id: string;
  name?: string;
  defaultValue?: string | null;
  invalid?: boolean;
  selectPlaceholder: string;
  customPlaceholder: string;
  addLabel: string;
  listLabel: string;
}

function isPresetArea(value: string | null | undefined): boolean {
  return Boolean(
    value &&
      (SYSTEM_AREAS as readonly string[]).includes(value),
  );
}

export function SystemAreaField({
  id,
  name = "systemArea",
  defaultValue,
  invalid = false,
  selectPlaceholder,
  customPlaceholder,
  addLabel,
  listLabel,
}: SystemAreaFieldProps): React.JSX.Element {
  const presetDefault = isPresetArea(defaultValue) ? defaultValue! : undefined;
  const customDefault =
    defaultValue && !isPresetArea(defaultValue) ? defaultValue : "";
  const [customMode, setCustomMode] = useState(Boolean(customDefault));

  return (
    <div className="flex gap-2">
      {customMode ? (
        <>
          <Input
            id={id}
            name={name}
            defaultValue={customDefault}
            maxLength={80}
            placeholder={customPlaceholder}
            className="h-11 min-w-0 flex-1 bg-white"
            aria-invalid={invalid}
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 bg-white"
            aria-label={listLabel}
            onClick={() => setCustomMode(false)}
          >
            <List aria-hidden="true" className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <Select name={name} defaultValue={presetDefault}>
            <SelectTrigger
              id={id}
              className="h-11! min-w-0 flex-1 bg-white"
              aria-invalid={invalid}
            >
              <SelectValue placeholder={selectPlaceholder}>
                {(value) => (value ? String(value) : selectPlaceholder)}
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 bg-white"
            aria-label={addLabel}
            onClick={() => setCustomMode(true)}
          >
            <Plus aria-hidden="true" className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
}
