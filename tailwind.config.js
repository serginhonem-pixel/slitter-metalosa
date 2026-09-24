/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#201e1d",
        "ink-soft": "rgba(32,30,29,.68)",
        "ink-faint": "rgba(32,30,29,.42)",
        paper: "#f3f2f2",
        "paper-2": "#eae9e9",
        accent: "#ec3013",
        "accent-700": "#ae1800",
        divider: "rgba(32,30,29,.16)",
      },
      fontFamily: {
        sans: ["Archivo", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
}
