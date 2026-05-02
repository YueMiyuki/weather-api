export const startedAt = Date.now();

export function uptimeMs(): number {
	return Date.now() - startedAt;
}

export function humanizeUptime(ms: number): string {
	const s = Math.floor(ms / 1000);
	const days = Math.floor(s / 86400);
	const hours = Math.floor((s % 86400) / 3600);
	const mins = Math.floor((s % 3600) / 60);
	const secs = s % 60;
	const parts: string[] = [];
	if (days) parts.push(`${days}d`);
	if (hours) parts.push(`${hours}h`);
	if (mins) parts.push(`${mins}m`);
	parts.push(`${secs}s`);
	return parts.join(" ");
}
