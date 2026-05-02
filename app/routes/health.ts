import type { Route } from "./+types/health";
import { getClientIp } from "@/lib/client-ip";
import { DAY_LIMIT, MINUTE_LIMIT, peekRateLimit } from "@/lib/rate-limit";
import { getRequestsToday, getStat } from "@/lib/stats";
import { humanizeUptime, startedAt, uptimeMs } from "@/lib/uptime";

export async function loader({ request }: Route.LoaderArgs) {
	const ip = getClientIp(request);
	const ms = uptimeMs();

	const [rl, requestsToday, cacheHits, cacheMisses, lastLatencyMs] =
		await Promise.all([
			peekRateLimit(ip),
			getRequestsToday(),
			getStat("cache_hits"),
			getStat("cache_misses"),
			getStat("last_upstream_ms"),
		]);

	const body = {
		status: "ok",
		version: "1.0.0",
		startedAt: new Date(startedAt).toISOString(),
		uptimeMs: ms,
		uptimeHuman: humanizeUptime(ms),
		requestIp: ip,
		rateLimit: {
			minute: {
				limit: MINUTE_LIMIT,
				remaining: rl.minuteRemaining,
				resetAt: new Date(rl.minuteResetAt).toISOString(),
			},
			day: {
				limit: DAY_LIMIT,
				remaining: rl.dayRemaining,
				resetAt: new Date(rl.dayResetAt).toISOString(),
			},
		},
		requestsToday,
		cache: {
			hits: cacheHits,
			misses: cacheMisses,
		},
		upstream: {
			lastLatencyMs,
		},
	};

	return new Response(JSON.stringify(body, null, 2), {
		status: 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}
