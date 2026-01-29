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
      fontFamily: {
        sans: ["Inter", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Brand Palette
        brand: {
          burgundy: "hsl(var(--brand-burgundy))",
          charcoal: "hsl(var(--brand-charcoal))",
          gold: "hsl(var(--brand-gold))",
          offwhite: "hsl(var(--brand-offwhite))",
          secondary: "hsl(var(--brand-secondary))",
        },
        // Dashboard Pastels
        pastel: {
          mint: "hsl(var(--pastel-mint))",
          blue: "hsl(var(--pastel-blue))",
          lavender: "hsl(var(--pastel-lavender))",
          peach: "hsl(var(--pastel-peach))",
        },

        primary: {
          DEFAULT: "#7A1E1E", // Burgundy
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1C1C1C", // Charcoal
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#C9A24D", // Gold
          foreground: "#1C1C1C",
        },
        destructive: {
          DEFAULT: "#B91C1C",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1C1C",
        },
        success: {
          DEFAULT: "#1E7F4E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#E08A1E",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "0.75rem", // 12px
        xl: "1rem",    // 16px
        "2xl": "1.5rem", // 24px
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.04)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
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

