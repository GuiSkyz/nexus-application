import { Platform } from "react-native";

const navy = {
  950: "#04162f",
  900: "#061f4a",
  800: "#062b78",
} as const;

const blue = {
  700: "#03449d",
  600: "#0757c8",
  500: "#1671e8",
  50: "#f1f7ff",
} as const;

const cyan = {
  600: "#0297bd",
  500: "#00b8e6",
  50: "#e8f9fd",
} as const;

export const colors = {
  navy,
  blue,
  cyan,

  nexus: {
    navy,
    blue,
    cyan,
  },

  surface: {
    page: "#f5f7fa",
    card: "#ffffff",
    muted: "#eef2f6",
    subtle: "#f8fafc",
  },

  text: {
    primary: "#17202e",
    secondary: "#667085",
    muted: "#98a2b3",
    inverse: "#ffffff",
  },

  border: {
    default: "#d8e0e8",
    strong: "#b9c7d8",
    focus: "#0757c8",
  },

  success: {
    DEFAULT: "#16a34a",
    foreground: "#15803d",
    soft: "#ecfdf3",
  },
  warning: {
    DEFAULT: "#f59e0b",
    foreground: "#b54708",
    soft: "#fffaeb",
  },
  danger: {
    DEFAULT: "#dc2626",
    foreground: "#b42318",
    soft: "#fef3f2",
  },
  info: {
    DEFAULT: "#00b8e6",
    foreground: "#027a9f",
    soft: "#e8f9fd",
  },
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 12,
} as const;

export const typography = {
  overline: { fontSize: 11, lineHeight: 16, fontWeight: "700" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "700" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  title: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
  heading: { fontSize: 26, lineHeight: 32, fontWeight: "800" as const },
} as const;

export const control = {
  minTouchTarget: 48,
  buttonHeight: 52,
  inputHeight: 52,
} as const;

// Movimento de produto: imediato, firme e nunca decorativo.
export const motion = {
  pressScale: 0.98,
  duration: 180,
} as const;

export const shadow = {
  sm: Platform.OS === "web"
    ? ({ boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)" } as any)
    : {
        shadowColor: "#101828",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
  md: Platform.OS === "web"
    ? ({ boxShadow: "0 2px 8px rgba(16, 24, 40, 0.05)" } as any)
    : {
        shadowColor: "#101828",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 40,
  8: 48,
} as const;
