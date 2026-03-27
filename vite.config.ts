import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * COEP `require-corp` needs CORP on subresources; without it Firefox often blocks
 * modules with “disallowed MIME type” / empty type.
 * Register first so every dev response (including /@vite, /node_modules) gets the header.
 */
function devCorpForCrossOriginIsolation(): Plugin {
	return {
		name: "dev-corp-for-coep",
		enforce: "pre",
		configureServer(server) {
			server.middlewares.use((_req, res, next) => {
				res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
				next();
			});
		},
	};
}

/**
 * Turso sets emnapi `asyncWorkPoolSize: 1`, which initializes pthread helpers and reads
 * `PThread.pthreads[tid].whenLoaded`. On Firefox that entry is often missing → "worker is undefined".
 * Size `0` keeps async work on the main thread and makes `initWorkers(0)` a no-op (empty Promise.all).
 */
function tursoEmnapiSingleThreadAsyncWork(): Plugin {
	return {
		name: "turso-emnapi-single-thread-async",
		enforce: "pre",
		transform(code, id) {
			const norm = id.split(path.sep).join("/");
			if (!norm.includes("database-wasm-common/dist/index.js")) {
				return null;
			}
			if (!code.includes("asyncWorkPoolSize: 1")) {
				return null;
			}
			return code.replace("asyncWorkPoolSize: 1", "asyncWorkPoolSize: 0");
		},
	};
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, ".", "");
	// Turso uses SharedArrayBuffer + a dedicated worker. Needs crossOriginIsolated
	// (COOP+COEP) plus CORP on dev responses so scripts are not blocked in Firefox.
	// Exclude the package from pre-bundle so `new URL('./worker.js', import.meta.url)` resolves.
	const crossOriginIsolationHeaders = {
		"Cross-Origin-Opener-Policy": "same-origin",
		"Cross-Origin-Embedder-Policy": "require-corp",
	};

	return {
		build: {
			target: "es2022",
		},
		optimizeDeps: {
			exclude: ["@tursodatabase/database-wasm"],
			esbuildOptions: {
				target: "es2022",
			},
		},
		plugins: [
			devCorpForCrossOriginIsolation(),
			tursoEmnapiSingleThreadAsyncWork(),
			react(),
			tailwindcss(),
			VitePWA({
				registerType: "autoUpdate",
				workbox: {
					maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
				},
				manifest: {
					name: "Pace",
					short_name: "Pace",
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
			headers: crossOriginIsolationHeaders,
		},
		preview: {
			headers: crossOriginIsolationHeaders,
		},
	};
});
