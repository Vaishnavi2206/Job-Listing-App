import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

// ── Checkbox ─────────────────────────────────────────────────

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Label text displayed next to the checkbox. */
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, disabled, className = "", id, ...rest }, ref) => {
    const wrapperClass = ["checkbox", disabled ? "checkbox--disabled" : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <label className={wrapperClass} htmlFor={id}>
        <input ref={ref} id={id} type="checkbox" disabled={disabled} {...rest} />
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

// ── Radio ─────────────────────────────────────────────────────

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Label text displayed next to the radio button. */
  label?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, disabled, className = "", id, ...rest }, ref) => {
    const wrapperClass = ["radio", disabled ? "radio--disabled" : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <label className={wrapperClass} htmlFor={id}>
        <input ref={ref} id={id} type="radio" disabled={disabled} {...rest} />
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Radio.displayName = "Radio";

// ── RadioGroup ───────────────────────────────────────────────

export interface RadioOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Legend / group label */
  legend?: string;
  /** Array of options to render as radio buttons */
  options: RadioOption[];
  /** Currently selected value */
  value?: string;
  /** Called when the selection changes */
  onChange?: (value: string) => void;
  /** HTML name attribute (all radios share the same name) */
  name: string;
  /** Disables all options in the group */
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({
  legend,
  options,
  value,
  onChange,
  name,
  disabled = false,
  className = "",
}: RadioGroupProps) {
  return (
    <fieldset className={["radio-group", className].filter(Boolean).join(" ")}>
      {legend && <legend className="radio-group__legend">{legend}</legend>}

      {options.map((opt) => (
        <Radio
          key={opt.value}
          id={`${name}-${opt.value}`}
          name={name}
          value={opt.value}
          label={opt.label}
          checked={value === opt.value}
          disabled={disabled || opt.disabled}
          onChange={() => onChange?.(opt.value)}
        />
      ))}
    </fieldset>
  );
}
