import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you deploy to GitHub Pages as a PROJECT page (e.g. username.github.io/webp-converter),
// change base below to "/webp-converter/" (your repo name, with slashes).
// Vercel and a GitHub Pages USER/ORG page (username.github.io) both want base: "/".
export default defineConfig({
  plugins: [react()],
  base: "/webp-converter/",
});
