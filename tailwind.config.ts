import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      spacing: {
        header: "var(--header-height)",
      },
      colors: {
        background: "var(--background)",
        foreground: "#3c3e39",

        // Primary brand palette (generated from #C76945)
        primary: {
          50: "#fdf4f1",
          100: "#fae4da",
          200: "#f4c5b0",
          300: "#eda586",
          400: "#e6865c",
          500: "#C76945", // base brand color
          600: "#a55338",
          700: "#83412c",
          800: "#613020",
          900: "#402014",
          DEFAULT: "#C76945",
        },

        // Secondary palette (generated from #9DA59F)
        secondary: {
          50: "#f6f7f6",
          100: "#e9ece9",
          200: "#cfd6d1",
          300: "#b5bfb9",
          400: "#9da59f",
          500: "#9DA59F", // base neutral green-gray
          600: "#7c837e",
          700: "#5d635f",
          800: "#3e423f",
          900: "#202120",
          DEFAULT: "#9DA59F",
        },

        neutral: {
          50: "#F9FAF9",
          100: "#F4EBE0",
          200: "#E8E9E6",
          300: "#D8DBD3",
          400: "#B6B9B4",
          500: "#9DA59F",
          600: "#7C847C",
          700: "#626c59",
          800: "#484E44",
          900: "#3c3e39",
        },

        accent: {
          DEFAULT: "#C76945",
          hover: "#A95538",
          subtle: "#E6B7A1",
        },

        // Wedding palette (used across the hero / intro)
        sage: "#58674a",
        "sage-muted": "#8a9079",
        cream: "#f7f3ea",
        wave: "#84a9b2",
      },

      fontFamily: {
        montserrat: ["var(--font-montserrat)"],
        tangerine: ["Tangerine", "cursive"],
        mulish: ["Mulish", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
