import { db } from "./db";

export const MINUTE_LIMIT = 60;
export const DAY_LIMIT = 2000;

const upsertStmt = db.prepare(`
  INSERT INTO rate_limit (ip, window, bucket, count) VALUES (?, ?, ?, 1)
  ON CONFLICT(ip, window, bucket) DO UPDATE SET count = count + 1
  RETURNING count
`);

const peekStmt = db.prepare(
	`SELECT count FROM rate_limit WHERE ip = ? AND window = ? AND bucket = ?`,
);

const cleanupStmt = db.prepare(
	`DELETE FROM rate_limit WHERE (window = 'minute' AND bucket < ?) OR (window = 'day' AND bucket < ?)`,
);

let lastCleanup = 0;
function maybeCleanup() {
	const now = Date.now();
	if (now - lastCleanup < 60_000) return;
	lastCleanup = now;
	const minuteBucket = Math.floor(now / 60_000) - 5;
	const dayBucket = Math.floor(now / 86_400_000) - 2;
	cleanupStmt.run(minuteBucket, dayBucket);
}

export interface RateLimitState {
	allowed: boolean;
	minuteRemaining: number;
	dayRemaining: number;
	minuteResetAt: number;
	dayResetAt: number;
	retryAfterSec: number;
}

export function checkRateLimit(ip: string): RateLimitState {
	maybeCleanup();
	const now = Date.now();
	const minuteBucket = Math.floor(now / 60_000);
	const dayBucket = Math.floor(now / 86_400_000);

	const minuteRow = upsertStmt.get(ip, "minute", minuteBucket) as {
		count: number;
	};
	const dayRow = upsertStmt.get(ip, "day", dayBucket) as { count: number };

	const minuteCount = minuteRow.count;
	const dayCount = dayRow.count;

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

export function peekRateLimit(ip: string): RateLimitState {
	const now = Date.now();
	const minuteBucket = Math.floor(now / 60_000);
	const dayBucket = Math.floor(now / 86_400_000);
	const minuteRow = peekStmt.get(ip, "minute", minuteBucket) as
		| { count: number }
		| undefined;
	const dayRow = peekStmt.get(ip, "day", dayBucket) as
		| { count: number }
		| undefined;
	const minuteCount = minuteRow?.count ?? 0;
	const dayCount = dayRow?.count ?? 0;
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
