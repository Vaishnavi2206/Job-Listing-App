import { useState, type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────

export type AlertVariant = "success" | "warning" | "danger" | "info";

export interface AlertProps {
  /** Color variant. */
  variant: AlertVariant;
  /** Optional bold title above the message. */
  title?: string;
  /** The main alert message. */
  message: ReactNode;
  /** Renders a dismiss × button. Calls onDismiss (or hides itself) when clicked. */
  dismissible?: boolean;
  /** Called when the dismiss button is clicked. */
  onDismiss?: () => void;
  /** Compact single-line layout without an icon. */
  compact?: boolean;
  className?: string;
}

// ── Icons ────────────────────────────────────────────────────
// Text symbols used as icons — no icon library dependency.

const ICONS: Record<AlertVariant, string> = {
  success: "✓",
  warning: "⚠",
  danger: "✕",
  info: "i",
};

// ── Component ────────────────────────────────────────────────

export default function Alert({
  variant,
  title,
  message,
  dismissible = false,
  onDismiss,
  compact = false,
  className = "",
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const classes = ["alert", `alert--${variant}`, compact ? "alert--compact" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="alert" aria-live="polite">
      {!compact && (
        <span className="alert__icon" aria-hidden="true">
          {ICONS[variant]}
        </span>
      )}

      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        <p className="alert__message">{message}</p>
      </div>

      {dismissible && (
        <button
          type="button"
          className="btn btn--ghost btn--icon btn--sm alert__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
