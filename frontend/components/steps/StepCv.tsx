"use client";
import { ChangeEvent, DragEvent, useId, useState } from "react";
import { AlertCircle, ArrowRight, FileText, Loader2, Upload } from "lucide-react";
import { uploadCv } from "@/lib/api";
import { messageOf } from "@/lib/errors";
import { CvSummary } from "@/lib/types";
import Button from "../ui/Button";

interface Props {
  cv: CvSummary | null;
  onUploaded: (cv: CvSummary) => void;
  onContinue: () => void;
}

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export default function StepCv({ cv, onUploaded, onContinue }: Props) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uploading on selection rather than behind a second click — there is
  // nothing to confirm, and the character count is the useful feedback.
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isPdf(file)) {
      setError("That file isn't a PDF. Matchr reads PDF CVs only.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const result = await uploadCv(file);
      onUploaded({ filename: file.name, chars: result.chars });
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) void handleFile(e.dataTransfer.files[0]);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFile(e.target.files?.[0]);
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Visually hidden but still focusable, so keyboard users get the
          native picker and the label below shows their focus ring. */}
      <input
        id={inputId}
        type="file"
        accept="application/pdf"
        className="peer sr-only"
        disabled={uploading}
        onChange={onSelect}
      />

      {cv ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-raised p-4 shadow-card">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-positive-soft text-positive">
            <FileText className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{cv.filename}</p>
            <p className="text-xs text-muted">
              <span className="font-mono tabular-nums">
                {cv.chars.toLocaleString("en-US")}
              </span>{" "}
              characters extracted
            </p>
          </div>
          <label
            htmlFor={inputId}
            className="cursor-pointer rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            Replace
          </label>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl
            border-2 border-dashed px-6 py-14 text-center transition-colors duration-150
            peer-focus-visible:border-accent
            ${dragging
              ? "border-accent bg-accent-soft"
              : "border-line-strong bg-raised hover:border-accent"
            }`}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-5" aria-hidden />
            )}
          </span>

          {uploading ? (
            <span className="text-sm font-medium text-ink">Reading your CV…</span>
          ) : (
            <>
              <span className="text-sm font-medium text-ink">
                Drop your CV here, or{" "}
                <span className="text-accent underline-offset-4 group-hover:underline">
                  browse
                </span>
              </span>
              <span className="text-xs text-muted">PDF only</span>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="flex items-start gap-2 text-sm text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!cv}>
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
