import type { Route } from "./+types/image";
import { Renderer } from "@takumi-rs/core";
import { ImageResponse } from "takumi-js/response";
import { WeatherCard } from "@/components/WeatherCard";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { bumpRequestsToday } from "@/lib/stats";
import { LocationNotFoundError, resolveLocation } from "@/lib/location";
import { fetchForecast } from "@/lib/open-meteo";
import { unitsFromOptions } from "@/lib/units";
import { parseOptions } from "@/lib/options";
import { parseColor } from "@/lib/color";
import { ensureGeistMono } from "@/lib/fonts";

const renderer = new Renderer();

const WIDTH = 1200;
const HEIGHT = 750;

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const ip = getClientIp(request);
	const rl = await checkRateLimit(ip);
	const rlHeaders = rateLimitHeaders(rl) as Record<string, string>;

	if (!rl.allowed) {
		return new Response(
			`Rate limit exceeded. Retry after ${rl.retryAfterSec}s.\n`,
			{
				status: 429,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"Retry-After": String(rl.retryAfterSec),
					...rlHeaders,
				},
			},
		);
	}

	await bumpRequestsToday();

	const opts = parseOptions(
		url.searchParams,
		request.headers.get("accept-language"),
	);
	const prefs = unitsFromOptions(opts);
	const pathSegment = url.searchParams.get("location");
	const bg = parseColor(url.searchParams.get("bg"));
	const fg = parseColor(url.searchParams.get("fg"));

	try {
		const location = await resolveLocation({
			pathSegment,
			query: url.searchParams,
			ip,
		});
		const report = await fetchForecast(location);
		await ensureGeistMono(renderer);

		const response = new ImageResponse(
			<WeatherCard report={report} prefs={prefs} bg={bg} fg={fg} />,
			{
				width: WIDTH,
				height: HEIGHT,
				emoji: "twemoji",
				renderer,
			},
		);

		for (const [k, v] of Object.entries(rlHeaders)) {
			response.headers.set(k, v);
		}
		response.headers.set("Cache-Control", "public, max-age=600");
		return response;
	} catch (err) {
		const status = err instanceof LocationNotFoundError ? 404 : 502;
		const msg =
			err instanceof Error ? err.message : "Failed to render weather image";
		return new Response(`${msg}\n`, {
			status,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				...rlHeaders,
			},
		});
	}
}
