import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), reactRouter()],
	resolve: {
		tsconfigPaths: true,
	},
	ssr: {
		external: ["@takumi-rs/core", "better-sqlite3"],
	},
	optimizeDeps: {
		exclude: ["@takumi-rs/core", "better-sqlite3"],
	},
});
