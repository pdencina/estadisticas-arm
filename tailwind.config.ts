import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arm: {
          50:  "#EEEDFE",
          100: "#CECBF6",
          400: "#7F77DD",
          600: "#534AB7",
          800: "#3C3489",
        },
      },
    },
  },
  plugins: [],
};
export default config;
