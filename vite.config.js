import { defineConfig } from "vite";      // imports vite's configuration helper.
import react from "@vitejs/plugin-react";   // loads the react plugin.

export default defineConfig({
    // tells vite that this project contains react/jsx, so process it using the react plugin.
    plugins: [react()],
    // don't set it to just true, its unsafe, Vite recommends explicitly listing hosts rather than setting it to true
    server: {
        allowedHosts: ['crumbelle-qy27.onrender.com']
    },
    // when Vite creates the production build, it puts the compiled React files inside public/dist & clears the old build files first.
    build: {
        outDir: "public/dist",
        emptyOutDir: true
    }
});