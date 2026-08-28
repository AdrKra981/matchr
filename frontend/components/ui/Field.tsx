"use client";
import { useId } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  inputMode?: "text" | "numeric";
  type?: "text" | "email" | "password";
  /** Lets password managers recognise the field — see the auth forms. */
  autoComplete?: string;
  required?: boolean;
}

export default function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  icon: Icon,
  inputMode = "text",
  type = "text",
  autoComplete,
  required,
}: Props) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
        )}
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-xl border bg-raised text-sm text-ink
            placeholder:text-muted transition-colors duration-150
            focus:outline-none focus-visible:border-accent
            ${Icon ? "pl-9 pr-3" : "px-3"}
            ${error ? "border-danger" : "border-line hover:border-line-strong"}`}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
