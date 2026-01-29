/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#b91c1c",
          foreground: "#fef2f2",
        },
        secondary: {
          DEFAULT: "#1f2933",
          foreground: "#f9fafb",
        },
        muted: {
          DEFAULT: "#111827",
          foreground: "#9ca3af",
        },
        accent: {
          DEFAULT: "#f97316",
          foreground: "#111827",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#fef2f2",
        },
        card: {
          DEFAULT: "#020617",
          foreground: "#e5e7eb",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

