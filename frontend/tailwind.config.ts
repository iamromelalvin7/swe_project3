import type { Config } from "tailwindcss";

// Values below are lifted verbatim from the approved design's own prototype:
// docs/design/app-refinement-feedback/project/Archive 233.dc.html — a
// self-contained, fully interactive prototype. The earlier _ds/industry-.../
// bundle in the same folder is an unrelated, unused design system left over
// in the same Claude Design project (confirmed with the project owner) — it
// is not this app's design.
//
// Unlike a formal design-token sheet, this prototype has no spacing/radius
// scale of its own — it uses per-element pixel values directly (desktop vs.
// mobile breakpoints), so only color and type are formalized as tokens here.
// This is the one place raw hex values are allowed to live.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF9F6",
        ink: "#12100E",
        grey: "#8C877D",
        rule: "#E4E1DA",
        signal: "#B23A20",
        sold: "#C42116",
        skeleton: "#EFEDE7",
        "hover-light": "#F2EFE9",
        "hover-dark": "#332E29",
        disabled: "#C9C5BC",
        plate: "#F4F2ED",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
