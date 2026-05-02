import { redis } from "./redis";

const STAT_PREFIX = "stat:";

export async function bumpStat(key: string, by = 1): Promise<void> {
	await redis.incrby(`${STAT_PREFIX}${key}`, by);
}

export async function setStat(key: string, value: number): Promise<void> {
	await redis.set(`${STAT_PREFIX}${key}`, value);
}

export async function getStat(key: string): Promise<number> {
	const v = await redis.get<number | string | null>(`${STAT_PREFIX}${key}`);
	if (v === null || v === undefined) return 0;
	return typeof v === "number" ? v : Number(v) || 0;
}

export async function getRequestsToday(): Promise<number> {
	const day = Math.floor(Date.now() / 86_400_000);
	return getStat(`requests_day_${day}`);
}

export async function bumpRequestsToday(): Promise<void> {
	const day = Math.floor(Date.now() / 86_400_000);
	await bumpStat(`requests_day_${day}`);
}
