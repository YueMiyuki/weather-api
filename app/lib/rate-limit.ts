import { redis } from "./redis";

export const MINUTE_LIMIT = 60;
export const DAY_LIMIT = 2000;

const RL_PREFIX = "rl:";

function bucketKey(
	ip: string,
	windowKind: "minute" | "day",
	bucket: number,
): string {
	return `${RL_PREFIX}${windowKind}:${ip}:${bucket}`;
}

async function bumpBucket(
	ip: string,
	windowKind: "minute" | "day",
	bucket: number,
	ttlSec: number,
): Promise<number> {
	const key = bucketKey(ip, windowKind, bucket);
	// Pipeline INCR + EXPIRE in a single round-trip. EXPIRE on every call is
	// safe and idempotent; Redis just resets the TTL to the same value.
	const p = redis.pipeline();
	p.incr(key);
	p.expire(key, ttlSec);
	const [count] = (await p.exec()) as [number, number];
	return count;
}

async function peekBucket(
	ip: string,
	windowKind: "minute" | "day",
	bucket: number,
): Promise<number> {
	const v = await redis.get<number | string | null>(
		bucketKey(ip, windowKind, bucket),
	);
	if (v === null || v === undefined) return 0;
	return typeof v === "number" ? v : Number(v) || 0;
}

export interface RateLimitState {
	allowed: boolean;
	minuteRemaining: number;
	dayRemaining: number;
	minuteResetAt: number;
	dayResetAt: number;
	retryAfterSec: number;
}

export async function checkRateLimit(ip: string): Promise<RateLimitState> {
	const now = Date.now();
	const minuteBucket = Math.floor(now / 60_000);
	const dayBucket = Math.floor(now / 86_400_000);

	const [minuteCount, dayCount] = await Promise.all([
		// Give buckets a small safety margin past their natural reset.
		bumpBucket(ip, "minute", minuteBucket, 120),
		bumpBucket(ip, "day", dayBucket, 86_400 + 60),
	]);

	const minuteResetAt = (minuteBucket + 1) * 60_000;
	const dayResetAt = (dayBucket + 1) * 86_400_000;

	const minuteOver = minuteCount > MINUTE_LIMIT;
	const dayOver = dayCount > DAY_LIMIT;
	const allowed = !minuteOver && !dayOver;

	let retryAfterSec = 0;
	if (!allowed) {
		const ms = minuteOver
			? minuteResetAt - now
			: Math.min(dayResetAt - now, 3600_000);
		retryAfterSec = Math.max(1, Math.ceil(ms / 1000));
	}

	return {
		allowed,
		minuteRemaining: Math.max(0, MINUTE_LIMIT - minuteCount),
		dayRemaining: Math.max(0, DAY_LIMIT - dayCount),
		minuteResetAt,
		dayResetAt,
		retryAfterSec,
	};
}

export async function peekRateLimit(ip: string): Promise<RateLimitState> {
	const now = Date.now();
	const minuteBucket = Math.floor(now / 60_000);
	const dayBucket = Math.floor(now / 86_400_000);
	const [minuteCount, dayCount] = await Promise.all([
		peekBucket(ip, "minute", minuteBucket),
		peekBucket(ip, "day", dayBucket),
	]);
	return {
		allowed: minuteCount <= MINUTE_LIMIT && dayCount <= DAY_LIMIT,
		minuteRemaining: Math.max(0, MINUTE_LIMIT - minuteCount),
		dayRemaining: Math.max(0, DAY_LIMIT - dayCount),
		minuteResetAt: (minuteBucket + 1) * 60_000,
		dayResetAt: (dayBucket + 1) * 86_400_000,
		retryAfterSec: 0,
	};
}

export function rateLimitHeaders(state: RateLimitState): HeadersInit {
	return {
		"X-RateLimit-Limit-Minute": String(MINUTE_LIMIT),
		"X-RateLimit-Remaining-Minute": String(state.minuteRemaining),
		"X-RateLimit-Reset-Minute": String(Math.floor(state.minuteResetAt / 1000)),
		"X-RateLimit-Limit-Day": String(DAY_LIMIT),
		"X-RateLimit-Remaining-Day": String(state.dayRemaining),
		"X-RateLimit-Reset-Day": String(Math.floor(state.dayResetAt / 1000)),
	};
}
