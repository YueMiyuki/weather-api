import type { Route } from "./+types/health";
import { getClientIp } from "@/lib/client-ip";
import { DAY_LIMIT, MINUTE_LIMIT, peekRateLimit } from "@/lib/rate-limit";
import { getRequestsToday, getStat } from "@/lib/stats";
import { humanizeUptime, startedAt, uptimeMs } from "@/lib/uptime";

export async function loader({ request }: Route.LoaderArgs) {
	const ip = getClientIp(request);
	const rl = peekRateLimit(ip);
	const ms = uptimeMs();

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
		requestsToday: getRequestsToday(),
		cache: {
			hits: getStat("cache_hits"),
			misses: getStat("cache_misses"),
		},
		upstream: {
			lastLatencyMs: getStat("last_upstream_ms"),
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
