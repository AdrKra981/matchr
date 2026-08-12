"use client";
import { useState } from "react";
import { ArrowLeft, Briefcase, MapPin, Search, Wallet } from "lucide-react";
import { FilterState } from "@/lib/types";
import Button from "../ui/Button";
import Field from "../ui/Field";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const RESULT_COUNTS = [10, 20, 30];

export default function StepFilters({
  filters,
  onChange,
  onBack,
  onSubmit,
}: Props) {
  const [errors, setErrors] = useState<{ what?: string; minSalary?: string }>({});

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const submit = () => {
    const next: typeof errors = {};

    if (!filters.what.trim()) next.what = "Enter a role to search for.";

    const salary = filters.minSalary.trim();
    if (salary && !/^\d+$/.test(salary)) {
      next.minSalary = "Enter a whole number, or leave this empty.";
    }

    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit();
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-raised p-5 shadow-card sm:p-6">
      <Field
        label="Role"
        value={filters.what}
        onChange={(v) => set("what", v)}
        placeholder="frontend developer"
        icon={Briefcase}
        error={errors.what}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="City"
          value={filters.city}
          onChange={(v) => set("city", v)}
          placeholder="Any city"
          icon={MapPin}
        />
        <Field
          label="Minimum salary"
          value={filters.minSalary}
          onChange={(v) => set("minSalary", v)}
          placeholder="12000"
          icon={Wallet}
          inputMode="numeric"
          hint="PLN per month, gross"
          error={errors.minSalary}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Results to rank</span>
        <div
          role="group"
          aria-label="Number of results to rank"
          className="inline-flex rounded-xl border border-line bg-sunken p-1"
        >
          {RESULT_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => set("topK", count)}
              aria-pressed={filters.topK === count}
              className={`h-9 w-16 rounded-lg font-mono text-sm tabular-nums transition-colors duration-150
                ${
                  filters.topK === count
                    ? "bg-raised font-semibold text-ink shadow-card"
                    : "text-muted hover:text-ink"
                }`}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          Each result is explained by an LLM, so more takes longer.
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-5">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button onClick={submit}>
          <Search className="size-4" aria-hidden />
          Find matches
        </Button>
      </div>
    </div>
  );
}
