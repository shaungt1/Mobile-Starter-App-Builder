const nativewindPreset = require("nativewind/preset");

function token(variable) {
  return `hsl(var(${variable}) / <alpha-value>)`;
}

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        background: token("--background"),
        foreground: token("--foreground"),
        card: { DEFAULT: token("--card"), foreground: token("--card-foreground") },
        popover: { DEFAULT: token("--popover"), foreground: token("--popover-foreground") },
        primary: { DEFAULT: token("--primary"), foreground: token("--primary-foreground") },
        secondary: { DEFAULT: token("--secondary"), foreground: token("--secondary-foreground") },
        muted: { DEFAULT: token("--muted"), foreground: token("--muted-foreground") },
        accent: { DEFAULT: token("--accent"), foreground: token("--accent-foreground") },
        destructive: {
          DEFAULT: token("--destructive"),
          foreground: token("--destructive-foreground"),
        },
        border: token("--border"),
        input: token("--input"),
        ring: token("--ring"),
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
