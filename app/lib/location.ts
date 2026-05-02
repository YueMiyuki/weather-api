import type { GeoResult } from "./open-meteo";
import { geocode } from "./open-meteo";
import { geoFromIp } from "./ip-geo";
import { isPrivateIp } from "./client-ip";
import { serverPublicIp } from "./server-ip";

export class LocationNotFoundError extends Error {
	constructor(public readonly query: string) {
		super(`Location not found: ${query}`);
	}
}

const DEFAULT_LOCATION = "London";

interface ResolveArgs {
	pathSegment: string | null;
	query: URLSearchParams;
	ip: string;
}

export async function resolveLocation(args: ResolveArgs): Promise<GeoResult> {
	// Explicit lat/lon
	const latStr = args.query.get("lat");
	const lonStr = args.query.get("lon");
	if (latStr && lonStr) {
		const lat = Number(latStr);
		const lon = Number(lonStr);
		if (Number.isFinite(lat) && Number.isFinite(lon)) {
			return {
				name: `${lat.toFixed(3)},${lon.toFixed(3)}`,
				country: "",
				countryCode: "",
				lat,
				lon,
				timezone: "auto",
			};
		}
	}

	const candidate =
		(args.pathSegment ?? "").trim() || args.query.get("location")?.trim() || "";

	if (candidate) {
		// lat,lon shorthand
		const m = candidate.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
		if (m) {
			return {
				name: candidate,
				country: "",
				countryCode: "",
				lat: Number(m[1]),
				lon: Number(m[2]),
				timezone: "auto",
			};
		}
		const decoded = decodeURIComponent(candidate)
			.replace(/^@/, "")
			.replace(/[+_]/g, " ");
		const result = await geocode(decoded);
		if (!result) throw new LocationNotFoundError(decoded);
		return result;
	}

	// No location given: try IP geolocation. When the request IP is private
	// (local dev / docker), fall back to the server's own public IP
	let lookupIp = args.ip;
	if (isPrivateIp(lookupIp)) {
		const publicIp = await serverPublicIp();
		if (publicIp) lookupIp = publicIp;
	}
	const ipGeo = await geoFromIp(lookupIp);
	if (ipGeo) {
		return {
			name: ipGeo.city ?? "Your location",
			country: ipGeo.country ?? "",
			countryCode: "",
			lat: ipGeo.lat,
			lon: ipGeo.lon,
			timezone: ipGeo.timezone ?? "auto",
		};
	}

	const fallback = await geocode(DEFAULT_LOCATION);
	if (!fallback) throw new LocationNotFoundError(DEFAULT_LOCATION);
	return fallback;
}
