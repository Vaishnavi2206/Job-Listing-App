import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Spinner from "./Spinner";

// ── Types ────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button. Defaults to "primary". */
  variant?: ButtonVariant;
  /** Size preset. Defaults to "md". */
  size?: ButtonSize;
  /** Shows a spinner and disables the button while true. */
  loading?: boolean;
  /** Renders as an icon-only circular button (no text label). */
  iconOnly?: boolean;
  /** Stretches the button to fill its container. */
  fullWidth?: boolean;
  /** Content rendered inside the button. */
  children: ReactNode;
}

// ── Component ────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      iconOnly = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    const classes = [
      "btn",
      `btn--${variant}`,
      `btn--${size}`,
      iconOnly ? "btn--icon" : "",
      fullWidth ? "btn--full" : "",
      loading ? "btn--loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const spinnerVariant =
      variant === "primary" || variant === "danger" || variant === "success" ? "light" : "dark";

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...rest}
      >
        <span className="btn__label">{children}</span>

        {loading && (
          <span className="btn__spinner" aria-hidden="true">
            <Spinner size={size === "lg" ? "sm" : "xs"} variant={spinnerVariant} />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
