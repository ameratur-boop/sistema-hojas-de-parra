import type { Config } from "tailwindcss";

const token = (name: string) => `oklch(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        side: token("side"),
        surface: token("surface"),
        raised: token("raised"),
        field: token("field"),
        line: token("line"),
        ink: token("ink"),
        "ink-2": token("ink-2"),
        "ink-3": token("ink-3"),
        accent: token("accent"),
        "accent-strong": token("accent-strong"),
        danger: token("danger"),
        warn: token("warn"),
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
