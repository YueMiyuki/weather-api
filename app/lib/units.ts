import type { Options } from "./options";

export type Units = "metric" | "imperial";
export type WindUnit = "kmh" | "mph" | "ms";

export interface UnitPrefs {
	temp: Units;
	wind: WindUnit;
}

export function unitsFromOptions(opts: Options): UnitPrefs {
	const temp: Units = opts.useImperial ? "imperial" : "metric";
	const wind: WindUnit = opts.useMs ? "ms" : opts.useImperial ? "mph" : "kmh";
	return { temp, wind };
}

export function tempUnitSym(u: Units): string {
	return u === "imperial" ? "°F" : "°C";
}

export function windUnitSym(u: WindUnit): string {
	if (u === "mph") return "mph";
	if (u === "ms") return "m/s";
	return "km/h";
}

export function fmtTempVal(c: number, u: Units): number {
	return u === "imperial" ? (c * 9) / 5 + 32 : c;
}

export function fmtTemp(c: number, prefs: UnitPrefs): string {
	const v = Math.round(fmtTempVal(c, prefs.temp));
	const sign = v > 0 ? "+" : "";
	return `${sign}${v}${tempUnitSym(prefs.temp)}`;
}

export function fmtTempPlain(c: number, prefs: UnitPrefs): string {
	const v = Math.round(fmtTempVal(c, prefs.temp));
	return `${v}${tempUnitSym(prefs.temp)}`;
}

export function fmtWindVal(kmh: number, u: WindUnit): number {
	if (u === "mph") return kmh * 0.621371;
	if (u === "ms") return kmh / 3.6;
	return kmh;
}

export function fmtWind(kmh: number, prefs: UnitPrefs): string {
	const v = Math.round(fmtWindVal(kmh, prefs.wind));
	return `${v} ${windUnitSym(prefs.wind)}`;
}

export function fmtVisibility(km: number, prefs: UnitPrefs): string {
	if (prefs.temp === "imperial") {
		return `${Math.round(km * 0.621371)} mi`;
	}
	return `${Math.round(km)} km`;
}

export function fmtPrecip(mm: number, prefs: UnitPrefs): string {
	if (prefs.temp === "imperial") {
		return `${(mm / 25.4).toFixed(2)} in`;
	}
	return `${mm.toFixed(1)} mm`;
}
