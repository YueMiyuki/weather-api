import { cached } from "./cache";
import { isPrivateIp } from "./client-ip";

export interface IpGeo {
	lat: number;
	lon: number;
	city?: string;
	country?: string;
	timezone?: string;
}

const TTL_MS = 60 * 60 * 1000;

export async function geoFromIp(ip: string): Promise<IpGeo | null> {
	if (isPrivateIp(ip)) return null;
	return cached<IpGeo | null>(`ipgeo:${ip}`, TTL_MS, async () => {
		try {
			const res = await fetch(`https://ipapi.co/${ip}/json/`, {
				headers: { "user-agent": "weather-api/1.0" },
				signal: AbortSignal.timeout(3000),
			});
			if (!res.ok) return null;
			const data = (await res.json()) as {
				latitude?: number;
				longitude?: number;
				city?: string;
				country_name?: string;
				timezone?: string;
				error?: boolean;
			};
			if (data.error || data.latitude == null || data.longitude == null)
				return null;
			return {
				lat: data.latitude,
				lon: data.longitude,
				city: data.city,
				country: data.country_name,
				timezone: data.timezone,
			};
		} catch {
			return null;
		}
	});
}
