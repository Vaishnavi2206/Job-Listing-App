import { type ReactNode, type HTMLAttributes } from "react";

// ── Types ────────────────────────────────────────────────────

export type CardVariant = "default" | "flat" | "interactive";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style. "interactive" adds hover lift; "flat" uses border. */
  variant?: CardVariant;
  /** Tighter padding across all card sections. */
  compact?: boolean;
  children: ReactNode;
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// ── Sub-components ───────────────────────────────────────────

export function CardHeader({ children, className = "", ...rest }: CardSectionProps) {
  return (
    <div className={`card__header ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", ...rest }: CardSectionProps) {
  return (
    <div className={`card__body ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...rest }: CardSectionProps) {
  return (
    <div className={`card__footer ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────

export default function Card({
  variant = "default",
  compact = false,
  children,
  className = "",
  ...rest
}: CardProps) {
  const classes = [
    "card",
    variant !== "default" ? `card--${variant}` : "",
    compact ? "card--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Interactive cards render as a button for full keyboard accessibility.
  // Wrap in a plain div if you need a non-button interactive card.
  if (variant === "interactive") {
    return (
      <div className={classes} role="button" tabIndex={0} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
