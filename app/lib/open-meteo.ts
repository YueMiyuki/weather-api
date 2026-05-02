import { cached } from "./cache";
import { setStat } from "./stats";

export interface GeoResult {
	name: string;
	country: string;
	countryCode: string;
	admin1?: string;
	lat: number;
	lon: number;
	timezone: string;
}

export interface HourlySlot {
	time: string;
	hour: number;
	weatherCode: number;
	tempC: number;
	feelsLikeC: number;
	humidity: number;
	precipitationMm: number;
	precipitationProbability: number;
	windKmh: number;
	windDirDeg: number;
	pressureHpa: number;
	visibilityKm: number;
	isDay: boolean;
}

export interface CurrentWeather {
	time: string;
	isDay: boolean;
	tempC: number;
	feelsLikeC: number;
	humidity: number;
	precipitationMm: number;
	weatherCode: number;
	windKmh: number;
	windDirDeg: number;
	pressureHpa: number;
	uvIndex: number | null;
	visibilityKm: number;
}

export interface DailyForecast {
	date: string;
	weatherCode: number;
	maxC: number;
	minC: number;
	precipitationMm: number;
	sunrise: string;
	sunset: string;
	uvIndexMax: number | null;
	slots: HourlySlot[];
}

export interface WeatherReport {
	location: GeoResult;
	current: CurrentWeather;
	daily: DailyForecast[];
}

const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const WEATHER_TTL_MS = 10 * 60 * 1000;

// Local hours for the four daily slots: morning, noon, evening, night.
const SLOT_HOURS = [8, 12, 17, 21] as const;

async function timed<T>(fn: () => Promise<T>): Promise<T> {
	const start = Date.now();
	try {
		return await fn();
	} finally {
		void setStat("last_upstream_ms", Date.now() - start);
	}
}

export async function geocode(name: string): Promise<GeoResult | null> {
	const key = `geo:${name.toLowerCase()}`;
	return cached<GeoResult | null>(key, GEO_TTL_MS, async () => {
		const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
		url.searchParams.set("name", name);
		url.searchParams.set("count", "1");
		url.searchParams.set("language", "en");
		url.searchParams.set("format", "json");
		const res = await timed(() => fetch(url));
		if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
		const data = (await res.json()) as {
			results?: Array<{
				name: string;
				country: string;
				country_code: string;
				admin1?: string;
				latitude: number;
				longitude: number;
				timezone: string;
			}>;
		};
		const r = data.results?.[0];
		if (!r) return null;
		return {
			name: r.name,
			country: r.country,
			countryCode: r.country_code,
			admin1: r.admin1,
			lat: r.latitude,
			lon: r.longitude,
			timezone: r.timezone,
		};
	});
}

export async function fetchForecast(
	loc: GeoResult,
	days = 3,
): Promise<WeatherReport> {
	const d = Math.min(7, Math.max(1, days));
	const key = `wx2:${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}:d${d}`;
	return cached<WeatherReport>(key, WEATHER_TTL_MS, async () => {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.set("latitude", String(loc.lat));
		url.searchParams.set("longitude", String(loc.lon));
		url.searchParams.set("timezone", loc.timezone || "auto");
		url.searchParams.set(
			"current",
			[
				"temperature_2m",
				"relative_humidity_2m",
				"apparent_temperature",
				"is_day",
				"precipitation",
				"weather_code",
				"pressure_msl",
				"wind_speed_10m",
				"wind_direction_10m",
				"visibility",
			].join(","),
		);
		url.searchParams.set(
			"hourly",
			[
				"temperature_2m",
				"relative_humidity_2m",
				"apparent_temperature",
				"precipitation",
				"precipitation_probability",
				"weather_code",
				"pressure_msl",
				"wind_speed_10m",
				"wind_direction_10m",
				"visibility",
				"is_day",
			].join(","),
		);
		url.searchParams.set(
			"daily",
			[
				"weather_code",
				"temperature_2m_max",
				"temperature_2m_min",
				"precipitation_sum",
				"sunrise",
				"sunset",
				"uv_index_max",
			].join(","),
		);
		url.searchParams.set("forecast_days", String(d));

		const res = await timed(() => fetch(url));
		if (!res.ok) throw new Error(`Forecast failed: ${res.status}`);
		const data = (await res.json()) as {
			current: {
				time: string;
				temperature_2m: number;
				relative_humidity_2m: number;
				apparent_temperature: number;
				is_day: number;
				precipitation: number;
				weather_code: number;
				pressure_msl: number;
				wind_speed_10m: number;
				wind_direction_10m: number;
				visibility: number;
			};
			hourly: {
				time: string[];
				temperature_2m: number[];
				relative_humidity_2m: number[];
				apparent_temperature: number[];
				precipitation: number[];
				precipitation_probability: (number | null)[];
				weather_code: number[];
				pressure_msl: number[];
				wind_speed_10m: number[];
				wind_direction_10m: number[];
				visibility: number[];
				is_day: number[];
			};
			daily: {
				time: string[];
				weather_code: number[];
				temperature_2m_max: number[];
				temperature_2m_min: number[];
				precipitation_sum: number[];
				sunrise: string[];
				sunset: string[];
				uv_index_max: (number | null)[];
			};
		};

		const current: CurrentWeather = {
			time: data.current.time,
			isDay: data.current.is_day === 1,
			tempC: data.current.temperature_2m,
			feelsLikeC: data.current.apparent_temperature,
			humidity: data.current.relative_humidity_2m,
			precipitationMm: data.current.precipitation,
			weatherCode: data.current.weather_code,
			windKmh: data.current.wind_speed_10m,
			windDirDeg: data.current.wind_direction_10m,
			pressureHpa: data.current.pressure_msl,
			uvIndex: data.daily.uv_index_max[0] ?? null,
			visibilityKm: data.current.visibility / 1000,
		};

		const hourlyIndex = new Map<string, number>();
		data.hourly.time.forEach((t, i) => hourlyIndex.set(t, i));

		const daily: DailyForecast[] = data.daily.time.map((date, i) => {
			const slots: HourlySlot[] = [];
			for (const h of SLOT_HOURS) {
				const stamp = `${date}T${String(h).padStart(2, "0")}:00`;
				const idx = hourlyIndex.get(stamp);
				if (idx === undefined) continue;
				slots.push({
					time: stamp,
					hour: h,
					weatherCode: data.hourly.weather_code[idx],
					tempC: data.hourly.temperature_2m[idx],
					feelsLikeC: data.hourly.apparent_temperature[idx],
					humidity: data.hourly.relative_humidity_2m[idx],
					precipitationMm: data.hourly.precipitation[idx],
					precipitationProbability:
						data.hourly.precipitation_probability[idx] ?? 0,
					windKmh: data.hourly.wind_speed_10m[idx],
					windDirDeg: data.hourly.wind_direction_10m[idx],
					pressureHpa: data.hourly.pressure_msl[idx],
					visibilityKm: data.hourly.visibility[idx] / 1000,
					isDay: data.hourly.is_day[idx] === 1,
				});
			}

			return {
				date,
				weatherCode: data.daily.weather_code[i],
				maxC: data.daily.temperature_2m_max[i],
				minC: data.daily.temperature_2m_min[i],
				precipitationMm: data.daily.precipitation_sum[i],
				sunrise: data.daily.sunrise[i],
				sunset: data.daily.sunset[i],
				uvIndexMax: data.daily.uv_index_max[i] ?? null,
				slots,
			};
		});

		return { location: loc, current, daily };
	});
}
