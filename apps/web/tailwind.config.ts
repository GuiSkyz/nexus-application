import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          navy: {
            950: "#04162f",
            900: "#061f4a",
            800: "#062b78",
          },
          blue: {
            700: "#03449d",
            600: "#0757c8",
            500: "#1671e8",
            50: "#f1f7ff",
          },
          cyan: {
            600: "#0297bd",
            500: "#00b8e6",
            50: "#e8f9fd",
          },
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
          DEFAULT: "#d8e0e8",
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
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(16, 24, 40, 0.04)",
        md: "0 2px 8px rgba(16, 24, 40, 0.05)",
        overlay: "0 12px 32px rgba(16, 24, 40, 0.12)",
      },
      spacing: {
        sidebar: "256px",
        "sidebar-collapsed": "72px",
        header: "64px",
      },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
