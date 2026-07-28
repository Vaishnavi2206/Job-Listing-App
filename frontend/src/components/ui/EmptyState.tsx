import { type ReactNode } from "react";
import Button, { type ButtonProps } from "./Button";

// ── Types ────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Emoji or icon element shown in the circle. */
  icon?: ReactNode;
  /** Primary heading. */
  title: string;
  /** Supporting description text. */
  message?: string;
  /** Optional action button rendered below the message. */
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
  };
  /** Compact layout with reduced padding and smaller icon. */
  compact?: boolean;
  className?: string;
}

export interface ErrorStateProps {
  /** Emoji or icon. Defaults to ⚠. */
  icon?: ReactNode;
  /** Primary heading. Defaults to "Something went wrong". */
  title?: string;
  /** Supporting description text. */
  message?: string;
  /** Optional retry / action button. */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Compact layout. */
  compact?: boolean;
  className?: string;
}

// ── EmptyState ───────────────────────────────────────────────

export function EmptyState({
  icon = "📭",
  title,
  message,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  const classes = ["empty-state", compact ? "empty-state--compact" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}

      <h3 className="empty-state__title">{title}</h3>

      {message && <p className="empty-state__message">{message}</p>}

      {action && (
        <Button variant={action.variant ?? "primary"} size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ── ErrorState ───────────────────────────────────────────────

export function ErrorState({
  icon = "⚠",
  title = "Something went wrong",
  message,
  action,
  compact = false,
  className = "",
}: ErrorStateProps) {
  const classes = ["error-state", compact ? "error-state--compact" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="error-state__icon" aria-hidden="true">
        {icon}
      </div>

      <h3 className="error-state__title">{title}</h3>

      {message && <p className="error-state__message">{message}</p>}

      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
