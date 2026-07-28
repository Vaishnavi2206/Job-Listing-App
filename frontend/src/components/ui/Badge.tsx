import { type ReactNode, type HTMLAttributes } from "react";

// ── Types ────────────────────────────────────────────────────

export type BadgeVariant = "neutral" | "blue" | "green" | "orange" | "red" | "purple";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color variant. Defaults to "neutral". */
  variant?: BadgeVariant;
  /** Size preset. Defaults to "md". */
  size?: BadgeSize;
  /** Prepends a colored dot matching the variant color. */
  dot?: boolean;
  children: ReactNode;
}

// ── Badge ────────────────────────────────────────────────────

export default function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  className = "",
  ...rest
}: BadgeProps) {
  const classes = [
    "badge",
    `badge--${variant}`,
    size !== "md" ? `badge--${size}` : "",
    dot ? "badge--dot" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
