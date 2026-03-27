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
        cream: {
          50: "#FFFFFF",
          100: "#FEFCF9",
          200: "#FAF0E8",
        },
        blush: {
          100: "#F8F0EB",
          200: "#EDD5CC",
          300: "#E0BFB4",
        },
        brown: {
          900: "#2C2220",
          700: "#4A3432",
          600: "#5C4345",
          500: "#7D5E60",
          400: "#9E8082",
          300: "#C0A5A7",
          200: "#DDD0D1",
        },
        terracotta: {
          400: "#D4A090",
          500: "#C4836A",
          600: "#B07560",
        },
        gold: {
          400: "#E0BA8A",
          500: "#D4A574",
          600: "#C49060",
        },
        sunset: {
          orange: "#E8956D",
          pink: "#D4688B",
          warm: "#F0B86E",
        },
      },
      fontFamily: {
        script: ["Great Vibes", "cursive"],
        serif: ["Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
        sans: ["DM Sans", "Lato", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
