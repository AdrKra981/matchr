interface Props {
  /** Match score, 0–100. */
  score: number;
  size?: number;
}

/**
 * Score bands. The colour is a second signal only — the numeral inside the
 * ring always carries the value, so nothing depends on colour alone.
 */
function bandColor(score: number): string {
  if (score >= 75) return "text-positive";
  if (score >= 50) return "text-attention";
  return "text-muted";
}

export default function ScoreRing({ score, size = 56 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 4.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`relative shrink-0 ${bandColor(clamped)}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {clamped}
        </span>
      </div>

      <span className="sr-only">{clamped} percent match</span>
    </div>
  );
}
