import { type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────

export interface FormFieldProps {
  /** The label text. Pass null/undefined to render no label. */
  label?: ReactNode;
  /** Appends a red asterisk to the label when true. */
  required?: boolean;
  /** Small helper text rendered below the input. */
  hint?: string;
  /** Error message — shown in red below the input. Overrides hint. */
  error?: string;
  /** Success message — shown in green below the input. */
  success?: string;
  /** The id to wire the label's htmlFor to. */
  htmlFor?: string;
  /** The form control (Input, Select, Textarea, Checkbox, etc.). */
  children: ReactNode;
  className?: string;
}

// ── Component ────────────────────────────────────────────────
// FormField is a pure layout wrapper — it does NOT render any
// form control itself. Pass the control as children.
//
// Usage:
//   <FormField label="Email" required error={errors.email?.message} htmlFor="email">
//     <Input id="email" error={!!errors.email} {...register('email')} />
//   </FormField>

export default function FormField({
  label,
  required = false,
  hint,
  error,
  success,
  htmlFor,
  children,
  className = "",
}: FormFieldProps) {
  const message = error ?? success ?? hint;
  const messageClass = error ? "form-error" : success ? "form-success" : "form-hint";

  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label className={`form-label${required ? " form-label--required" : ""}`} htmlFor={htmlFor}>
          {label}
        </label>
      )}

      {children}

      {message && (
        <p className={messageClass} role={error ? "alert" : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
