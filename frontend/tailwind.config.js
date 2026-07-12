/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        // Anthropic ultra-premium minimalist palette
        ivory: {
          50: "#ffffff",
          100: "#faf9f5", // Main background ("Oat/Ivory")
          200: "#f3f1eb",
          300: "#e9e6dc",
          400: "#ded9cd",
        },
        slate: {
          900: "#141413", // Main typography ("Slate/Dark")
          800: "#222220",
          700: "#3d3d3a",
          600: "#585854",
          500: "#75756f",
          400: "#96968f",
          300: "#b8b8b0",
          200: "#dadad4",
          100: "#f0f0ed",
        },
        accent: {
          cotswold: "#d97706", // Muted warm amber/cotswold gold accent
          terracotta: "#c2410c", // Subtle terracotta alert/wrong answer
          sage: "#4d7c0f",       // Subtle sage/green for accepted
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Source Serif Pro",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      transitionTimingFunction: {
        "anthropic-ease": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
