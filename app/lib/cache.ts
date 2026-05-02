import { redis } from "./redis";
import { bumpStat } from "./stats";

const CACHE_PREFIX = "cache:";

export async function cacheGet<T>(key: string): Promise<T | null> {
	// Upstash auto-deserializes JSON values stored via the SDK.
	const value = await redis.get<T>(`${CACHE_PREFIX}${key}`);
	if (value === null || value === undefined) {
		await bumpStat("cache_misses");
		return null;
	}
	await bumpStat("cache_hits");
	return value;
}

export async function cacheSet(
	key: string,
	value: unknown,
	ttlMs: number,
): Promise<void> {
	const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
	await redis.set(`${CACHE_PREFIX}${key}`, value, { ex: ttlSec });
}

export async function cached<T>(
	key: string,
	ttlMs: number,
	loader: () => Promise<T>,
): Promise<T> {
	const hit = await cacheGet<T>(key);
	if (hit !== null) return hit;
	const value = await loader();
	await cacheSet(key, value, ttlMs);
	return value;
}
