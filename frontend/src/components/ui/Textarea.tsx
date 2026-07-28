import { forwardRef, type TextareaHTMLAttributes } from "react";

// ── Types ────────────────────────────────────────────────────

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Controls min-height preset. Defaults to "md". */
  size?: TextareaSize;
  /** Error state — applies red border. */
  error?: boolean;
}

// ── Component ────────────────────────────────────────────────

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = "md", error = false, className = "", ...rest }, ref) => {
    const classes = [
      "textarea",
      size !== "md" ? `textarea--${size}` : "",
      error ? "textarea--error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <textarea ref={ref} className={classes} {...rest} />;
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
