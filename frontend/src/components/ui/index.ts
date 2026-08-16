/**
 * UI Component Library — Barrel Export
 *
 * Import from this file in application code:
 *   import { Button, Input, FormField, Badge } from '@/components/ui';
 *   // or
 *   import { Button } from '../components/ui';
 */

// ── Buttons ──────────────────────────────────────────────────
export { default as Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

// ── Form Controls ────────────────────────────────────────────
export { default as Input, PasswordInput } from "./Input";
export type { InputProps, PasswordInputProps, InputSize } from "./Input";

export { default as Select } from "./Select";
export type { SelectProps, SelectOption, SelectSize } from "./Select";

export { default as Textarea } from "./Textarea";
export type { TextareaProps, TextareaSize } from "./Textarea";

export { Checkbox, Radio, RadioGroup } from "./Checkbox";
export type { CheckboxProps, RadioProps, RadioGroupProps, RadioOption } from "./Checkbox";

// ── Form Layout ──────────────────────────────────────────────
export { default as FormField } from "./FormField";
export type { FormFieldProps } from "./FormField";

// ── Data Display ─────────────────────────────────────────────
export { default as Card, CardHeader, CardBody, CardFooter } from "./Card";
export type { CardProps, CardVariant } from "./Card";

export { default as Badge } from "./Badge";
export type { BadgeProps, BadgeVariant, BadgeSize } from "./Badge";
export { statusToBadgeVariant } from "./badge.utils";

export { default as Chip } from "./Chip";
export type { ChipProps, ChipVariant } from "./Chip";

// ── Feedback ─────────────────────────────────────────────────
export { default as Alert } from "./Alert";
export type { AlertProps, AlertVariant } from "./Alert";

export { default as Spinner, Loader } from "./Spinner";
export type { SpinnerProps, SpinnerSize, SpinnerVariant, LoaderProps } from "./Spinner";

export { EmptyState, ErrorState } from "./EmptyState";
export type { EmptyStateProps, ErrorStateProps } from "./EmptyState";

// ── Overlays ─────────────────────────────────────────────────
export { default as Tooltip } from "./Tooltip";
export type { TooltipProps, TooltipPlacement } from "./Tooltip";
