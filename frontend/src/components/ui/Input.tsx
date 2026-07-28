import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Size preset. Controls padding and font-size. Defaults to "md". */
  size?: InputSize;
  /** Error state — applies red border and error ring. */
  error?: boolean;
  /** Icon rendered on the left side of the input. */
  startIcon?: ReactNode;
  /** Icon rendered on the right side of the input. */
  endIcon?: ReactNode;
  /** Makes the end icon interactive (e.g., clear or reveal password). */
  onEndIconClick?: () => void;
}

// ── Text Input ───────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { size = "md", error = false, startIcon, endIcon, onEndIconClick, className = "", ...rest },
    ref
  ) => {
    const inputClasses = [
      "input",
      size !== "md" ? `input--${size}` : "",
      error ? "input--error" : "",
      startIcon ? "input--has-icon-left" : "",
      endIcon ? "input--has-icon-right" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (startIcon || endIcon) {
      return (
        <div className="input-wrapper">
          {startIcon && (
            <span className="input-wrapper__icon input-wrapper__icon--left" aria-hidden="true">
              {startIcon}
            </span>
          )}

          <input ref={ref} className={inputClasses} {...rest} />

          {endIcon &&
            (onEndIconClick ? (
              <button
                type="button"
                className="input-wrapper__icon input-wrapper__icon--right input-wrapper__icon--action"
                onClick={onEndIconClick}
                tabIndex={-1}
              >
                {endIcon}
              </button>
            ) : (
              <span className="input-wrapper__icon input-wrapper__icon--right" aria-hidden="true">
                {endIcon}
              </span>
            ))}
        </div>
      );
    }

    return <input ref={ref} className={inputClasses} {...rest} />;
  }
);

Input.displayName = "Input";

// ── Password Input ───────────────────────────────────────────
// Extends Input with a built-in reveal/hide toggle.

export type PasswordInputProps = Omit<InputProps, "type" | "endIcon" | "onEndIconClick">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      endIcon={<span className="input-icon-emoji">{visible ? "🙈" : "👁"}</span>}
      onEndIconClick={() => setVisible((v) => !v)}
      aria-label={props["aria-label"] ?? "Password"}
    />
  );
});

PasswordInput.displayName = "PasswordInput";

export default Input;
