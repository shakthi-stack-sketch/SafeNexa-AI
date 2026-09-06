import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--bg)",
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          elevated: "var(--surface-elevated)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
          hover: "var(--accent-hover)",
          contrast: "var(--accent-contrast)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        sif: {
          high: "var(--sif-high)",
          "high-bg": "var(--sif-high-bg)",
          medium: "var(--sif-medium)",
          "medium-bg": "var(--sif-medium-bg)",
          low: "var(--sif-low)",
          "low-bg": "var(--sif-low-bg)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          subtle: "var(--border-subtle)",
        },
      },
      borderRadius: {
        "xl": "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        subtle: "0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)",
        card: "0 8px 24px -6px rgba(0, 0, 0, 0.12), 0 2px 6px -2px rgba(0, 0, 0, 0.08)",
        dropdown: "0 12px 32px -4px rgba(0, 0, 0, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.1)",
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
