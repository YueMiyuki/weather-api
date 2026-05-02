import { getClientIp } from "@/lib/client-ip";
import { bumpRequestsToday } from "@/lib/stats";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { LocationNotFoundError, resolveLocation } from "@/lib/location";
import { fetchForecast } from "@/lib/open-meteo";
import { formatFull, formatNotFound } from "@/lib/weather-format";
import { renderFormat } from "@/lib/format-string";
import { unitsFromOptions } from "@/lib/units";
import { parseOptions } from "@/lib/options";

const NOISE_PATHS = new Set([
	"favicon.ico",
	"robots.txt",
	"sitemap.xml",
	"apple-touch-icon.png",
	"apple-touch-icon-precomposed.png",
]);

const TERMINAL_UA =
	/(curl|wget|httpie|fetch|powershell|terminal|http_request)/i;

function clientWantsAnsi(ua: string | null): boolean {
	if (!ua) return true; // raw clients (no UA) default to terminal
	return TERMINAL_UA.test(ua);
}

export async function handleTextRequest(
	request: Request,
	splat: string,
): Promise<Response> {
	const url = new URL(request.url);
	const segment = splat.replace(/^\/+|\/+$/g, "");

	if (segment && (NOISE_PATHS.has(segment) || segment.startsWith("_"))) {
		return new Response("Not found\n", { status: 404 });
	}

	const ip = getClientIp(request);
	const rl = checkRateLimit(ip);
	const headers: Record<string, string> = {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "public, max-age=300",
		...(rateLimitHeaders(rl) as Record<string, string>),
	};

	if (!rl.allowed) {
		headers["Retry-After"] = String(rl.retryAfterSec);
		return new Response(
			`Rate limit exceeded. Retry after ${rl.retryAfterSec}s.\n`,
			{ status: 429, headers },
		);
	}

	bumpRequestsToday();
	const opts = parseOptions(
		url.searchParams,
		request.headers.get("accept-language"),
	);

	// Only emit ANSI escapes when the client looks like a
	// terminal. Browsers (and unknown UAs) get plain text by default; users can
	// force colors with `?A`
	if (
		!opts.noColor &&
		!opts.forceColor &&
		!clientWantsAnsi(request.headers.get("user-agent"))
	) {
		opts.noColor = true;
	}

	const prefs = unitsFromOptions(opts);

	try {
		const location = await resolveLocation({
			pathSegment: segment || null,
			query: url.searchParams,
			ip,
		});
		const report = await fetchForecast(location, Math.max(1, opts.days));
		const body = opts.format
			? renderFormat(opts.format, report, prefs, opts.lang)
			: formatFull(report, prefs, opts);
		return new Response(body, { status: 200, headers });
	} catch (err) {
		if (err instanceof LocationNotFoundError) {
			return new Response(formatNotFound(err.query), {
				status: 404,
				headers,
			});
		}
		const msg = err instanceof Error ? err.message : String(err);
		return new Response(`Upstream error: ${msg}\n`, {
			status: 502,
			headers,
		});
	}
}
