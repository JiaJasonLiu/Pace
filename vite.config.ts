import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
	return {
		plugins: [
			react(),
			tailwindcss(),
			VitePWA({
				registerType: "autoUpdate",
				manifest: {
					name: "Pace",
					description: "A minimal, mobile-first budget tracker.",
					theme_color: "#7851A9",
					background_color: "#F8FAFC",
					display: "standalone",
					icons: [
						{
							src: "/pwa-icon.svg",
							sizes: "any",
							type: "image/svg+xml",
							purpose: "any maskable",
						},
					],
				},
			}),
		],
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
