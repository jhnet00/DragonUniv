import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dragon: {
          black: "#0B0B0B",
          wine: "#5C0A1D",
          ruby: "#7A1E35",
          ink: "#1C1919",
          cloud: "#F5F5F5",
          muted: "#B8B8B8",
          gold: "#C9A86A"
        }
      }
    }
  },
  plugins: [],
} satisfies Config;
