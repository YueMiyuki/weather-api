import { cached } from "./cache";

const TTL_MS = 60 * 60 * 1000;
const KEY = "server:public_ip";

/**
 * Returns the server's own public IPv4 address, cached for 1 hour.
 * Used as a fallback when the request IP is private (local dev).
 */
export async function serverPublicIp(): Promise<string | null> {
	return cached<string | null>(KEY, TTL_MS, async () => {
		const sources = [
			"https://api.ipify.org",
			"https://ipv4.icanhazip.com",
			"https://ifconfig.me/ip",
		];
		for (const url of sources) {
			try {
				const res = await fetch(url, {
					headers: { "user-agent": "weather-api/1.0" },
					signal: AbortSignal.timeout(3000),
				});
				if (!res.ok) continue;
				const text = (await res.text()).trim();
				if (/^\d+\.\d+\.\d+\.\d+$/.test(text)) return text;
			} catch {
				// try next
			}
		}
		return null;
	});
}
