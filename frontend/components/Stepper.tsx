import { Check } from "lucide-react";

const STEPS = ["Your CV", "Filters", "Matches"];

interface Props {
  /** Zero-based index of the step the user is on. */
  current: number;
}

export default function Stepper({ current }: Props) {
  return (
    <ol className="flex items-center" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <li
            key={label}
            className={`flex items-center ${i > 0 ? "flex-1" : ""}`}
            aria-current={active ? "step" : undefined}
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`mx-2 h-px flex-1 transition-colors duration-300 sm:mx-3 ${
                  done || active ? "bg-accent" : "bg-line"
                }`}
              />
            )}

            <span className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full border text-xs font-semibold
                  transition-colors duration-300
                  ${
                    done
                      ? "border-accent bg-accent text-accent-on"
                      : active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line bg-raised text-muted"
                  }`}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>

              <span
                className={`hidden text-sm sm:inline ${
                  active ? "font-medium text-ink" : "text-muted"
                }`}
              >
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
