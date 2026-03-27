function isFirefox(): boolean {
	return typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
}

/**
 * Turso in the browser uses shared `WebAssembly.Memory`, which needs
 * [cross-origin isolation](https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated).
 * Firefox surfaces failures as opaque worker / WASM errors unless we check first.
 */
export function assertBrowserSupportsPaceDb(): void {
	if (typeof SharedArrayBuffer !== "undefined") {
		return;
	}

	if (isFirefox()) {
		throw new Error(
			"Firefox: SharedArrayBuffer is not available, so the local database cannot start. " +
				"Pace needs cross-origin isolation (COOP + COEP). From this repo run `npm run dev`, open the exact http://localhost URL Vite prints, then hard-refresh (Ctrl+Shift+R). " +
				"Use a normal window if Private Browsing blocks storage. " +
				"If you proxy or host elsewhere, send Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: require-corp, and Cross-Origin-Resource-Policy: same-origin on the document and scripts.",
		);
	}

	throw new Error(
		"SharedArrayBuffer is not available; the local database cannot start. " +
			"Serve the app with cross-origin isolation headers (see vite.config.ts).",
	);
}
