// WMO weather codes -> label, emoji, ASCII art
// Reference: https://open-meteo.com/en/docs (weathercode)

export interface WeatherInfo {
	label: string;
	emoji: string;
	art: readonly string[];
}

const ART = {
	sun: [
		"    \\   /    ",
		"     .-.     ",
		"  - (   ) -  ",
		"     `-'     ",
		"    /   \\    ",
	],
	partlyCloudy: [
		"   \\  /      ",
		' _ /"".-.    ',
		"   \\_(   ).  ",
		"   /(___(__) ",
		"             ",
	],
	cloudy: [
		"             ",
		"     .--.    ",
		"  .-(    ).  ",
		" (___.__)__) ",
		"             ",
	],
	fog: [
		" _ - _ - _ - ",
		"  _ - _ - _  ",
		" _ - _ - _ - ",
		"  _ - _ - _  ",
		"             ",
	],
	rain: [
		"     .-.     ",
		"    (   ).   ",
		"   (___(__)  ",
		"  ' ' ' ' '  ",
		" ' ' ' ' '   ",
	],
	heavyRain: [
		"     .-.     ",
		"    (   ).   ",
		"   (___(__)  ",
		" ,',',',',  ",
		" ,',',',',  ",
	],
	snow: [
		"     .-.     ",
		"    (   ).   ",
		"   (___(__)  ",
		"   *  *  *   ",
		"  *  *  *    ",
	],
	sleet: [
		"     .-.     ",
		"    (   ).   ",
		"   (___(__)  ",
		"   ' * ' *   ",
		"  * ' * '    ",
	],
	thunder: [
		"     .-.     ",
		"    (   ).   ",
		"   (___(__)  ",
		"  /_/_/_/_/  ",
		"   ' ' ' '   ",
	],
} as const;

const TABLE: Record<number, WeatherInfo> = {
	0: { label: "Clear sky", emoji: "☀️", art: ART.sun },
	1: { label: "Mainly clear", emoji: "🌤️", art: ART.partlyCloudy },
	2: { label: "Partly cloudy", emoji: "⛅", art: ART.partlyCloudy },
	3: { label: "Overcast", emoji: "☁️", art: ART.cloudy },
	45: { label: "Fog", emoji: "🌫️", art: ART.fog },
	48: { label: "Rime fog", emoji: "🌫️", art: ART.fog },
	51: { label: "Light drizzle", emoji: "🌦️", art: ART.rain },
	53: { label: "Drizzle", emoji: "🌦️", art: ART.rain },
	55: { label: "Dense drizzle", emoji: "🌧️", art: ART.rain },
	56: { label: "Freezing drizzle", emoji: "🌧️", art: ART.sleet },
	57: { label: "Dense freezing drizzle", emoji: "🌧️", art: ART.sleet },
	61: { label: "Light rain", emoji: "🌦️", art: ART.rain },
	63: { label: "Rain", emoji: "🌧️", art: ART.rain },
	65: { label: "Heavy rain", emoji: "🌧️", art: ART.heavyRain },
	66: { label: "Freezing rain", emoji: "🌧️", art: ART.sleet },
	67: { label: "Heavy freezing rain", emoji: "🌧️", art: ART.sleet },
	71: { label: "Light snow", emoji: "🌨️", art: ART.snow },
	73: { label: "Snow", emoji: "❄️", art: ART.snow },
	75: { label: "Heavy snow", emoji: "❄️", art: ART.snow },
	77: { label: "Snow grains", emoji: "🌨️", art: ART.snow },
	80: { label: "Rain showers", emoji: "🌦️", art: ART.rain },
	81: { label: "Heavy rain showers", emoji: "🌧️", art: ART.heavyRain },
	82: { label: "Violent rain showers", emoji: "⛈️", art: ART.heavyRain },
	85: { label: "Snow showers", emoji: "🌨️", art: ART.snow },
	86: { label: "Heavy snow showers", emoji: "❄️", art: ART.snow },
	95: { label: "Thunderstorm", emoji: "⛈️", art: ART.thunder },
	96: { label: "Thunderstorm w/ hail", emoji: "⛈️", art: ART.thunder },
	99: { label: "Severe thunderstorm", emoji: "⛈️", art: ART.thunder },
};

export function describeWeather(code: number): WeatherInfo {
	return TABLE[code] ?? { label: "Unknown", emoji: "❔", art: ART.cloudy };
}

export function backgroundForCode(code: number, isDay: boolean): string {
	if (!isDay) return "linear-gradient(135deg, #0f172a, #1e1b4b)";
	if (code === 0 || code === 1)
		return "linear-gradient(135deg, #fde68a, #f59e0b)";
	if (code === 2) return "linear-gradient(135deg, #bae6fd, #60a5fa)";
	if (code === 3 || code === 45 || code === 48)
		return "linear-gradient(135deg, #cbd5e1, #64748b)";
	if (code >= 71 && code <= 86)
		return "linear-gradient(135deg, #e0f2fe, #93c5fd)";
	if (code >= 95) return "linear-gradient(135deg, #4c1d95, #1e293b)";
	return "linear-gradient(135deg, #93c5fd, #1d4ed8)"; // rain default
}

export function windDirArrow(deg: number): string {
	const dirs = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"];
	return dirs[Math.round((deg % 360) / 45) % 8];
}

export function windDirText(deg: number): string {
	const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
	return dirs[Math.round((deg % 360) / 45) % 8];
}
