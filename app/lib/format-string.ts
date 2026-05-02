import type { CurrentWeather, HourlySlot, WeatherReport } from "./open-meteo";
import type { UnitPrefs } from "./units";
import { fmtTemp, fmtWind, windUnitSym } from "./units";
import { conditionLabel } from "./i18n";
import type { Lang } from "./i18n";
import { describeWeather, windDirArrow } from "./weather-codes";

/**
 * Render a line. Supports presets "1".."4"
 * and the standard %-codes for any custom string.
 */
export function renderFormat(
	fmt: string,
	report: WeatherReport,
	prefs: UnitPrefs,
	lang: Lang,
): string {
	const preset: Record<string, string> = {
		"1": "%c %t",
		"2": "%c %t %w",
		"3": "%l: %c %t",
		"4": "%l: %c %t %w",
	};
	const tmpl = preset[fmt] ?? fmt;
	return interpolate(tmpl, report.current, report, prefs, lang) + "\n";
}

const MOON_PHASES = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"] as const;

function moonPhaseSymbol(now = new Date()): string {
	// Reference new moon: 2000-01-06 18:14 UTC
	const ref = Date.UTC(2000, 0, 6, 18, 14);
	const synodic = 29.530588853 * 24 * 60 * 60 * 1000;
	const phase = (((now.getTime() - ref) % synodic) + synodic) % synodic;
	const idx = Math.floor((phase / synodic) * 8) % 8;
	return MOON_PHASES[idx];
}

function moonDay(now = new Date()): number {
	const ref = Date.UTC(2000, 0, 6, 18, 14);
	const synodic = 29.530588853 * 24 * 60 * 60 * 1000;
	const phase = (((now.getTime() - ref) % synodic) + synodic) % synodic;
	return Math.floor(phase / (24 * 60 * 60 * 1000));
}

function dewPointC(tempC: number, humidity: number): number {
	return tempC - (100 - humidity) / 5;
}

function interpolate(
	tmpl: string,
	data: CurrentWeather | HourlySlot,
	report: WeatherReport,
	prefs: UnitPrefs,
	lang: Lang,
): string {
	return tmpl.replace(/%([cCxhtfwlmMpPeuDsSizZ])/g, (_, code: string) => {
		switch (code) {
			case "c": {
				const info = describeWeather(data.weatherCode);
				return info.emoji;
			}
			case "C":
				return conditionLabel(data.weatherCode, lang);
			case "x":
				return describeWeather(data.weatherCode).label;
			case "h":
				return `${data.humidity}%`;
			case "t":
				return fmtTemp(data.tempC, prefs);
			case "f":
				return fmtTemp(data.feelsLikeC, prefs);
			case "w":
				return `${windDirArrow(data.windDirDeg)}${fmtWind(data.windKmh, prefs)}`;
			case "l":
				return report.location.name;
			case "m":
				return moonPhaseSymbol();
			case "M":
				return String(moonDay());
			case "p": {
				const mm = "precipitationMm" in data ? data.precipitationMm : 0;
				return `${mm.toFixed(1)}mm`;
			}
			case "P":
				return `${Math.round(data.pressureHpa)}hPa`;
			case "e":
				return fmtTemp(dewPointC(data.tempC, data.humidity), prefs);
			case "u": {
				const u = report.current.uvIndex;
				return u == null ? "-" : String(Math.round(u));
			}
			case "D":
				return report.daily[0]?.sunrise.split("T")[1] ?? "";
			case "s":
				return report.daily[0]?.sunset.split("T")[1] ?? "";
			case "S":
				return report.daily[0]?.sunrise.split("T")[1] ?? "";
			case "i":
				return String(data.weatherCode);
			case "z":
				return "";
			case "Z":
				return report.location.timezone;
			default:
				return `%${code}`;
		}
	});
}

// Tiny helper used by callers to detect a windUnitSym change is needed
export const _windUnitSym = windUnitSym;
