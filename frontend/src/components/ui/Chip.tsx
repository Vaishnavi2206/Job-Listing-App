import { type ReactNode, type HTMLAttributes } from "react";

// ── Types ────────────────────────────────────────────────────

export type ChipVariant = "neutral" | "blue" | "green" | "orange";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color variant. Defaults to "neutral". */
  variant?: ChipVariant;
  /** Called when the × dismiss button is clicked. Omit to hide the button. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to "Remove". */
  dismissLabel?: string;
  /** Makes the entire chip clickable. */
  interactive?: boolean;
  children: ReactNode;
}

// ── Component ────────────────────────────────────────────────

export default function Chip({
  variant = "neutral",
  onDismiss,
  dismissLabel = "Remove",
  interactive = false,
  children,
  className = "",
  ...rest
}: ChipProps) {
  const classes = [
    "chip",
    variant !== "neutral" ? `chip--${variant}` : "",
    interactive ? "chip--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {children}

      {onDismiss && (
        <button
          type="button"
          className="chip__dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label={dismissLabel}
        >
          ×
        </button>
      )}
    </span>
  );
}
