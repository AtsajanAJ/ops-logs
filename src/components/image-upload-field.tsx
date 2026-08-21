"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, XIcon } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { MAX_INCIDENT_IMAGES } from "@/lib/incidents";

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface SignedUploadPayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

interface DoneImage {
  id: string;
  url: string;
  name: string;
  meta: string;
}

interface PendingImage {
  id: string;
  name: string;
  meta: string;
  progress: number;
}

interface ImageUploadFieldProps {
  id?: string;
  name?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

function formatFileMeta(file: File): string {
  const type = file.type.split("/")[1]?.toUpperCase() ?? "IMG";
  const kib = file.size / 1024;
  const size =
    kib >= 1024
      ? `${(kib / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(kib))} KB`;
  return `${type} · ${size}`;
}

async function requestSignature(): Promise<SignedUploadPayload> {
  const response = await fetch("/api/cloudinary/sign", { method: "POST" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? "Could not prepare image upload.");
  }
  return (await response.json()) as SignedUploadPayload;
}

function uploadToCloudinary(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  return requestSignature().then(
    (signed) =>
      new Promise<string>((resolve, reject) => {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signed.apiKey);
        body.append("timestamp", String(signed.timestamp));
        body.append("signature", signed.signature);
        body.append("folder", signed.folder);

        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
        );

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable || event.total <= 0) return;
          onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        };

        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error("Cloudinary rejected the upload."));
            return;
          }

          try {
            const payload = JSON.parse(xhr.responseText) as {
              secure_url?: string;
            };
            if (!payload.secure_url) {
              reject(new Error("Cloudinary did not return an image URL."));
              return;
            }
            onProgress(100);
            resolve(payload.secure_url);
          } catch {
            reject(new Error("Cloudinary did not return an image URL."));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Cloudinary rejected the upload."));
        };

        xhr.send(body);
      }),
  );
}

export function ImageUploadField({
  id,
  name = "imageUrls",
  onUploadingChange,
}: ImageUploadFieldProps): React.JSX.Element | null {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [images, setImages] = useState<DoneImage[]>([]);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [error, setError] = useState("");

  const uploading = pending.length > 0;
  const remaining = MAX_INCIDENT_IMAGES - images.length - pending.length;

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch("/api/cloudinary/sign");
        const payload = (await response.json()) as { enabled?: boolean };
        if (!cancelled) setEnabled(Boolean(payload.enabled));
      } catch {
        if (!cancelled) setEnabled(false);
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [onUploadingChange, uploading]);

  if (enabled !== true) {
    return null;
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || remaining <= 0) return;

    const selected = Array.from(fileList).slice(0, remaining);
    setError("");

    for (const file of selected) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setError(t("form.imageTypeError"));
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(t("form.imageSizeError"));
        continue;
      }

      const pendingId = crypto.randomUUID();
      const meta = formatFileMeta(file);

      setPending((current) => [
        ...current,
        { id: pendingId, name: file.name, meta, progress: 0 },
      ]);

      try {
        const url = await uploadToCloudinary(file, (percent) => {
          setPending((current) =>
            current.map((item) =>
              item.id === pendingId ? { ...item, progress: percent } : item,
            ),
          );
        });
        setImages((current) => {
          if (current.length >= MAX_INCIDENT_IMAGES) return current;
          return [...current, { id: pendingId, url, name: file.name, meta }];
        });
      } catch (uploadError: unknown) {
        console.error("Image upload failed", uploadError);
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : t("form.imageUploadFailed"),
        );
      } finally {
        setPending((current) => current.filter((item) => item.id !== pendingId));
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(imageId: string) {
    setImages((current) => current.filter((image) => image.id !== imageId));
    setError("");
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>
        {t("form.photos")}{" "}
        <span className="font-normal text-muted-foreground">
          {t("form.optional")}
        </span>
      </Label>

      {images.map((image) => (
        <input key={image.id} type="hidden" name={name} value={image.url} />
      ))}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        disabled={uploading || remaining <= 0}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {remaining > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 bg-white"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus data-icon="inline-start" />
            {t("form.addPhotos")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("form.photosHint")}</p>
        </div>
      )}

      {(pending.length > 0 || images.length > 0) && (
        <div className="grid gap-2" aria-label={t("form.photos")}>
          {pending.map((item) => (
            <Attachment
              key={item.id}
              state="uploading"
              className="w-full max-w-md"
            >
              <AttachmentMedia>
                <Spinner />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{item.name}</AttachmentTitle>
                <AttachmentDescription>
                  {t("form.uploadingProgress", { percent: String(item.progress) })}
                </AttachmentDescription>
              </AttachmentContent>
            </Attachment>
          ))}

          {images.map((image, index) => (
            <Attachment
              key={image.id}
              state="done"
              className="w-full max-w-md"
            >
              <AttachmentMedia variant="image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={t("form.photoAlt", { index: String(index + 1) })}
                />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{image.name}</AttachmentTitle>
                <AttachmentDescription>{image.meta}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  type="button"
                  aria-label={t("form.removePhoto")}
                  disabled={uploading}
                  onClick={() => removeImage(image.id)}
                >
                  <XIcon />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
