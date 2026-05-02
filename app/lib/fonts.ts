import type { Renderer } from "@takumi-rs/core";

// Geist Mono TTFs fetched on demand from the official Vercel CDN once per
// process. Loaded into the takumi renderer the first time we render an image.
const GEIST_MONO_URLS: ReadonlyArray<{
	weight: number;
	url: string;
}> = [
	{
		weight: 400,
		url: "https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-mono/GeistMono-Regular.ttf",
	},
	{
		weight: 500,
		url: "https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-mono/GeistMono-Medium.ttf",
	},
	{
		weight: 700,
		url: "https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-mono/GeistMono-Bold.ttf",
	},
];

let loadPromise: Promise<void> | null = null;

export function ensureGeistMono(renderer: Renderer): Promise<void> {
	if (loadPromise) return loadPromise;
	loadPromise = (async () => {
		const fonts = await Promise.all(
			GEIST_MONO_URLS.map(async ({ weight, url }) => {
				const res = await fetch(url, { redirect: "follow" });
				if (!res.ok) {
					throw new Error(`font fetch failed: ${url} (${res.status})`);
				}
				const data = new Uint8Array(await res.arrayBuffer());
				return { name: "Geist Mono", weight, style: "normal", data };
			}),
		);
		await renderer.loadFonts(fonts);
	})().catch((err) => {
		// Allow retry on next request if the network blip clears.
		loadPromise = null;
		throw err;
	});
	return loadPromise;
}
