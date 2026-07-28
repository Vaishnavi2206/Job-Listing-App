// ── Types ────────────────────────────────────────────────────

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "dark" | "light" | "blue" | "muted";

export interface SpinnerProps {
  /** Size preset. Defaults to "md". */
  size?: SpinnerSize;
  /** Color variant. Defaults to "dark". */
  variant?: SpinnerVariant;
  /** Accessible label for screen readers. Defaults to "Loading". */
  label?: string;
  className?: string;
}

// ── Component ────────────────────────────────────────────────

export default function Spinner({
  size = "md",
  variant = "dark",
  label = "Loading",
  className = "",
}: SpinnerProps) {
  const classes = ["spinner", `spinner--${size}`, `spinner--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} role="status" aria-label={label} />;
}

// ── Loader (Spinner + optional text, centered) ────────────────

export interface LoaderProps {
  /** Spinner size. Defaults to "lg". */
  size?: SpinnerSize;
  /** Spinner color. Defaults to "blue". */
  variant?: SpinnerVariant;
  /** Text displayed below the spinner. */
  label?: string;
  /** Renders spinner and text inline instead of stacked. */
  inline?: boolean;
  className?: string;
}

export function Loader({
  size = "lg",
  variant = "blue",
  label,
  inline = false,
  className = "",
}: LoaderProps) {
  const classes = ["loader", inline ? "loader--inline" : "", className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="status" aria-live="polite">
      <Spinner size={size} variant={variant} label={label ?? "Loading"} />
      {label && <span aria-hidden="true">{label}</span>}
    </div>
  );
}
