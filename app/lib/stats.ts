import { db } from "./db";

const incrementStmt = db.prepare(`
  INSERT INTO stats (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = value + excluded.value
`);

const setStmt = db.prepare(`
  INSERT INTO stats (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

const getStmt = db.prepare(`SELECT value FROM stats WHERE key = ?`);

export function bumpStat(key: string, by = 1): void {
	incrementStmt.run(key, by);
}

export function setStat(key: string, value: number): void {
	setStmt.run(key, value);
}

export function getStat(key: string): number {
	const row = getStmt.get(key) as { value: number } | undefined;
	return row?.value ?? 0;
}

export function getRequestsToday(): number {
	const day = Math.floor(Date.now() / 86_400_000);
	return getStat(`requests_day_${day}`);
}

export function bumpRequestsToday(): void {
	const day = Math.floor(Date.now() / 86_400_000);
	bumpStat(`requests_day_${day}`);
}
