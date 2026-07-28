import { type ReactNode, type HTMLAttributes } from "react";

// ── Types ────────────────────────────────────────────────────

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  /** The tooltip text displayed on hover/focus. */
  content: string;
  /** Position relative to the trigger. Defaults to "top". */
  placement?: TooltipPlacement;
  /** The element that triggers the tooltip. */
  children: ReactNode;
}

// ── Component ────────────────────────────────────────────────
// Uses the CSS-only data-tooltip system from tooltip.css.
// The wrapping <span> carries data-tooltip and data-tooltip-placement.
//
// For accessibility, the tooltip content is also announced via
// aria-describedby pointing to a visually-hidden span. This ensures
// screen readers read the tooltip text when the child is focused,
// regardless of browser/AT implementation of data-* attributes.

let _tooltipId = 0;

export default function Tooltip({
  content,
  placement = "top",
  children,
  className = "",
  ...rest
}: TooltipProps) {
  // Generate a stable id once per component instance (not reactive).
  // We use a module-level counter rather than useId to avoid the
  // React 18 useId hydration requirement.
  const id = `tooltip-${++_tooltipId}`;

  const wrapperClasses = ["tooltip-wrapper", className].filter(Boolean).join(" ");

  return (
    <span
      className={wrapperClasses}
      data-tooltip={content}
      data-tooltip-placement={placement === "top" ? undefined : placement}
      aria-describedby={id}
      style={{ display: "inline-flex", alignItems: "center" }}
      {...rest}
    >
      {children}

      {/* Visually hidden — read by screen readers on focus */}
      <span
        id={id}
        role="tooltip"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {content}
      </span>
    </span>
  );
}
