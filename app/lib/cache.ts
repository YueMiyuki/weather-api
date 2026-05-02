import { db } from "./db";
import { bumpStat } from "./stats";

const getStmt = db.prepare(`SELECT value, expires_at FROM cache WHERE key = ?`);
const setStmt = db.prepare(
	`INSERT INTO cache (key, value, expires_at) VALUES (?, ?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
);
const deleteStmt = db.prepare(`DELETE FROM cache WHERE key = ?`);

export function cacheGet<T>(key: string): T | null {
	const row = getStmt.get(key) as
		| { value: string; expires_at: number }
		| undefined;
	if (!row) {
		bumpStat("cache_misses");
		return null;
	}
	if (row.expires_at < Date.now()) {
		deleteStmt.run(key);
		bumpStat("cache_misses");
		return null;
	}
	bumpStat("cache_hits");
	return JSON.parse(row.value) as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
	setStmt.run(key, JSON.stringify(value), Date.now() + ttlMs);
}

export async function cached<T>(
	key: string,
	ttlMs: number,
	loader: () => Promise<T>,
): Promise<T> {
	const hit = cacheGet<T>(key);
	if (hit !== null) return hit;
	const value = await loader();
	cacheSet(key, value, ttlMs);
	return value;
}
