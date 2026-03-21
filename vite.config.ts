import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, ".", "");
	return {
		plugins: [
			react(),
			tailwindcss(),
			VitePWA({
				registerType: "autoUpdate",
				manifest: {
					name: "Royal Budget",
					short_name: "Royal",
					description: "A minimal, mobile-first budget tracker.",
					theme_color: "#7851A9",
					background_color: "#F8FAFC",
					display: "standalone",
					icons: [
						{
							src: "https://picsum.photos/seed/royal/192/192",
							sizes: "192x192",
							type: "image/png",
						},
						{
							src: "https://picsum.photos/seed/royal/512/512",
							sizes: "512x512",
							type: "image/png",
						},
					],
				},
			}),
		],
		define: {
			"process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		server: {
			hmr: process.env.DISABLE_HMR !== "true",
		},
	};
});
