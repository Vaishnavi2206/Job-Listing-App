/**
 * ============================================================
 * DESIGN SYSTEM — TYPESCRIPT THEME
 *
 * JavaScript-accessible mirror of the CSS custom property tokens.
 * Keep this file in sync with the CSS token files in ./tokens/.
 *
 * Use for:
 *  - MUI ThemeProvider (colors, typography, shadows, spacing)
 *  - Inline styles that need token values
 *  - Media query hooks (window.matchMedia)
 *  - Conditional logic that depends on design values
 *  - Tests and Storybook configuration
 *
 * NOTE: Breakpoints live here (not in CSS) because CSS custom
 * properties cannot be interpolated inside @media rules.
 * ============================================================
 */

// ── Colors ──────────────────────────────────────────────────

export const colors = {
  primary: {
    900: "#030712",
    800: "#111827",
    700: "#1f2937",
    600: "#374151",
    500: "#4b5563",
    400: "#6b7280",
    300: "#9ca3af",
    200: "#d1d5db",
    100: "#f3f4f6",
    50: "#f9fafb",
  },
  blue: {
    700: "#1d4ed8",
    600: "#2563eb",
    50: "#eef6ff",
    25: "#f3f8ff",
  },
  green: {
    700: "#047857",
    50: "#ecfdf5",
  },
  orange: {
    700: "#c2410c",
    50: "#fff7ed",
  },
  red: {
    700: "#b91c1c",
    50: "#fef2f2",
  },
  purple: {
    700: "#6d28d9",
    50: "#f5f3ff",
  },
  surface: {
    page: "#f5f7fb",
    card: "#ffffff",
    subtle: "#f9fafb",
  },
  border: "#e5e7eb",
  borderInput: "#dddddd",
  text: {
    primary: "#111827",
    secondary: "#6b7280",
    muted: "#4b5563",
    inverse: "#ffffff",
    link: "#1d4ed8",
    success: "#047857",
    error: "#b91c1c",
    warning: "#c2410c",
  },
  action: {
    primary: "#111827",
    primaryHover: "#1f2937",
    disabledBg: "#e5e7eb",
  },
} as const;

// ── Typography ───────────────────────────────────────────────

export const typography = {
  fontFamily: {
    primary: "Inter, system-ui, -apple-system, sans-serif",
    fallback: "system-ui, -apple-system, sans-serif",
  },
  fontSize: {
    xs: "13px",
    sm: "14px",
    base: "15px",
    md: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "36px",
    "5xl": "44px",
    "6xl": "52px",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.35,
    normal: 1.4,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: "-0.03em",
    snug: "-0.02em",
    normal: "0em",
    wide: "0.03em",
    wider: "0.08em",
  },
} as const;

// ── Spacing ──────────────────────────────────────────────────

export const spacing = {
  // Raw 4px-grid scale
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  9: "36px",
  10: "40px",
  12: "48px",
  14: "56px",
  15: "60px",
  16: "64px",
  // Semantic aliases
  formGap: "14px", // off-grid; preserved from existing design
  panelPad: "18px", // off-grid; preserved from existing design
  detailsPad: "26px", // off-grid; preserved from existing design
  pagePadding: "40px",
  cardPadding: "24px",
  sectionGap: "36px",
} as const;

// ── Shadows ──────────────────────────────────────────────────

export const shadows = {
  none: "none",
  xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
  sm: "0 4px 10px rgba(0, 0, 0, 0.15)",
  md: "0 4px 20px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 30px rgba(0, 0, 0, 0.08)",
  xl: "0 14px 35px rgba(0, 0, 0, 0.10)",
  insetAccent: "inset 4px 0 0 #2563eb",
} as const;

// ── Border Radius ────────────────────────────────────────────

export const borderRadius = {
  xs: "4px",
  sm: "6px",
  base: "8px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  "2xl": "20px",
  full: "9999px",
  circle: "50%",
} as const;

// ── Breakpoints ──────────────────────────────────────────────
// CSS custom properties cannot be used inside @media rules.
// Define breakpoints here and use them in media queries via JS
// (e.g., window.matchMedia) or reference in CSS @media directly.

export const breakpoints = {
  mobile: "480px",
  tablet: "760px", // current responsive breakpoint in App.css
  desktop: "1024px",
  wide: "1280px",
} as const;

// Helper strings for use with window.matchMedia or CSS-in-JS
export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.mobile})`,
  tablet: `(max-width: ${breakpoints.tablet})`,
  desktop: `(max-width: ${breakpoints.desktop})`,
  wide: `(max-width: ${breakpoints.wide})`,
  tabletAndAbove: `(min-width: ${breakpoints.tablet})`,
} as const;

// ── Animation ────────────────────────────────────────────────

export const animation = {
  duration: {
    instant: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    xslow: "500ms",
    pulse: "1.4s",
  },
  easing: {
    default: "ease",
    in: "ease-in",
    out: "ease-out",
    inOut: "ease-in-out",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// ── Z-index ──────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ── Icon Sizing ──────────────────────────────────────────────

export const iconSize = {
  xs: "12px",
  sm: "16px",
  md: "20px", // badge count circles currently at 20px × 20px
  lg: "24px",
  xl: "32px", // circular action buttons (e.g., close button)
} as const;

// ── Container Widths ─────────────────────────────────────────

export const containerWidth = {
  xs: "420px", // applied jobs panel max-width
  sm: "600px",
  md: "960px",
  lg: "1200px",
  xl: "1440px",
} as const;

// ── Opacity ──────────────────────────────────────────────────

export const opacity = {
  disabled: 0.6, // disabled buttons and inputs
  muted: 0.7, // de-emphasized UI elements
  subtle: 0.55, // skeleton pulse animation floor
  full: 1,
} as const;

// ── Full Theme Export ────────────────────────────────────────

const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  breakpoints,
  mediaQueries,
  animation,
  zIndex,
  iconSize,
  containerWidth,
  opacity,
} as const;

export default theme;
