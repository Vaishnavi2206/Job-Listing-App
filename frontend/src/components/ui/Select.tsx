import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Omit 'size' because HTML's SelectHTMLAttributes.size is a number,
// but our size prop is a string preset ('sm' | 'md' | 'lg').
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Size preset. Defaults to "md". */
  size?: SelectSize;
  /** Error state — applies red border. */
  error?: boolean;
  /** Placeholder option shown when no value is selected. */
  placeholder?: string;
  /** Strongly-typed option list. Can also just use <option> children. */
  options?: SelectOption[];
  /** Children (option elements) override the options prop. */
  children?: ReactNode;
}

// ── Component ────────────────────────────────────────────────

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { size = "md", error = false, placeholder, options, children, className = "", ...rest },
    ref
  ) => {
    const classes = [
      "select",
      size !== "md" ? `select--${size}` : "",
      error ? "select--error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <select ref={ref} className={classes} {...rest}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

Select.displayName = "Select";

export default Select;
