import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        petrol: {
          50: "#e7f7f6",
          100: "#c4ece9",
          500: "#007d7a",
          700: "#005f5d",
          900: "#003b3a",
        },
        neon: "#d7ff2f",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        lowhofer: {
          primary: "#007d7a",
          "primary-content": "#ffffff",
          secondary: "#d7ff2f",
          "secondary-content": "#10312f",
          accent: "#ff6b6b",
          neutral: "#233634",
          "base-100": "#f6fbfa",
          "base-200": "#e7f7f6",
          "base-300": "#c4ece9",
          "base-content": "#142321",
          info: "#2b7fff",
          success: "#10a46a",
          warning: "#f59e0b",
          error: "#dc2626",
        },
      },
    ],
  },
};

export default config;
