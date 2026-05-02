import { Table, type ITheme } from "cmd-table";
import type { DailyForecast, HourlySlot, WeatherReport } from "./open-meteo";
import type { UnitPrefs } from "./units";
import {
	fmtTemp,
	fmtWind,
	fmtPrecip,
	fmtVisibility,
	fmtTempVal,
	tempUnitSym,
} from "./units";
import { color, colorTemp, visibleWidth } from "./ansi";
import { conditionLabel, t } from "./i18n";
import { describeWeather, windDirArrow } from "./weather-codes";
import type { WeatherInfo } from "./weather-codes";
import type { Options } from "./options";

const ART_W = 13;

// Pad/truncate a single art row to exactly ART_W display columns
function normalizeArtLine(line: string): string {
	const w = visibleWidth(line);
	if (w === ART_W) return line;
	if (w < ART_W) return line + " ".repeat(ART_W - w);
	let out = "";
	let width = 0;
	for (const ch of line) {
		const cw = visibleWidth(ch);
		if (width + cw > ART_W) break;
		out += ch;
		width += cw;
	}
	return out + " ".repeat(ART_W - width);
}

function normalizedArt(info: WeatherInfo): string[] {
	const rows = (info.art as readonly string[])
		.slice(0, 5)
		.map(normalizeArtLine);
	while (rows.length < 5) rows.push(" ".repeat(ART_W));
	return rows;
}

// Truncate to a max display-column width with a trailing '+' marker
function trimToWidth(s: string, max: number): string {
	if (visibleWidth(s) <= max) return s;
	let out = "";
	let w = 0;
	for (const ch of s) {
		const cw = visibleWidth(ch);
		if (w + cw > max - 1) break;
		out += ch;
		w += cw;
	}
	return out + "+";
}

const ASCII_THEME: ITheme = {
	topBody: "-",
	topJoin: "+",
	topLeft: "+",
	topRight: "+",
	bottomBody: "-",
	bottomJoin: "+",
	bottomLeft: "+",
	bottomRight: "+",
	bodyLeft: "|",
	bodyRight: "|",
	bodyJoin: "|",
	joinBody: "-",
	joinLeft: "+",
	joinRight: "+",
	joinJoin: "+",
};

const UNICODE_THEME: ITheme = {
	topBody: "─",
	topJoin: "┬",
	topLeft: "┌",
	topRight: "┐",
	bottomBody: "─",
	bottomJoin: "┴",
	bottomLeft: "└",
	bottomRight: "┘",
	bodyLeft: "│",
	bodyRight: "│",
	bodyJoin: "│",
	joinBody: "─",
	joinLeft: "├",
	joinRight: "┤",
	joinJoin: "┼",
};

function themeFor(opts: Options): ITheme {
	return opts.dumb ? ASCII_THEME : UNICODE_THEME;
}

function locationHeader(report: WeatherReport, opts: Options): string {
	const loc = report.location;
	const cityLine = [loc.name, loc.admin1, loc.country]
		.filter(Boolean)
		.join(", ");
	if (opts.superQuiet) return "";
	if (opts.quiet) return cityLine + "\n";
	return `${t("weather_report", opts.lang)}: ${cityLine}\n`;
}

function timeOfDayLabel(slot: HourlySlot, opts: Options): string {
	const h = slot.hour;
	if (h < 11) return t("morning", opts.lang);
	if (h < 15) return t("noon", opts.lang);
	if (h < 19) return t("evening", opts.lang);
	return t("night", opts.lang);
}

function dayLabel(day: DailyForecast, index: number): string {
	const d = new Date(day.date);
	const labels = ["Today", "Tomorrow"];
	const name =
		index < 2
			? labels[index]
			: d.toLocaleDateString("en-US", { weekday: "long" });
	const date = d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
	return `${name} ${date}`;
}

// Build the multi-line cell content for one slot: 5 rows of [art  stats]
function slotCell(slot: HourlySlot, prefs: UnitPrefs, opts: Options): string {
	const info = describeWeather(slot.weatherCode);
	const cond = conditionLabel(slot.weatherCode, opts.lang);
	const art = normalizedArt(info);

	const condTrim = trimToWidth(cond, 15);
	const stats = [
		color(condTrim, 250, opts.noColor),
		`${colorTemp(fmtTempVal(slot.tempC, prefs.temp), "", opts.noColor)}(${colorTemp(fmtTempVal(slot.feelsLikeC, prefs.temp), "", opts.noColor)}) ${tempUnitSym(prefs.temp)}`,
		`${color(windDirArrow(slot.windDirDeg), 220, opts.noColor)} ${fmtWind(slot.windKmh, prefs)}`,
		fmtVisibility(slot.visibilityKm, prefs),
		`${fmtPrecip(slot.precipitationMm, prefs)} | ${slot.precipitationProbability}%`,
	];

	const artColor = slot.isDay ? 226 : 33;
	return art
		.map((a, i) => `${color(a, artColor, opts.noColor)}  ${stats[i] ?? ""}`)
		.join("\n");
}

function renderDayBlock(
	day: DailyForecast,
	index: number,
	prefs: UnitPrefs,
	opts: Options,
): string {
	let slots = day.slots;
	if (opts.narrow) {
		slots = slots.filter((s) => s.hour < 11 || s.hour >= 19);
		if (slots.length === 0) slots = day.slots.slice(0, 2);
	}

	const table = new Table({
		theme: themeFor(opts),
		headerGroups: [{ title: dayLabel(day, index), colSpan: slots.length || 1 }],
		// Disable cmd-table's default magenta header / cyan first-column tint;
		// we manage all coloring ourselves so browsers viewing /weather don't
		// see stray `[39m`
		headerColor: "none",
	});

	for (const s of slots) {
		table.addColumn({
			name: timeOfDayLabel(s, opts),
			align: "left",
			vAlign: "top",
			color: "none",
		});
	}

	const row: Record<string, string> = {};
	for (const s of slots) {
		row[timeOfDayLabel(s, opts)] = slotCell(s, prefs, opts);
	}
	table.addRow(row);

	return table.render();
}

function renderCurrentBlock(
	report: WeatherReport,
	prefs: UnitPrefs,
	opts: Options,
): string {
	const c = report.current;
	const info = describeWeather(c.weatherCode);
	const cond = conditionLabel(c.weatherCode, opts.lang);
	const art = normalizedArt(info);

	const stats = [
		color(cond, 250, opts.noColor),
		`${colorTemp(fmtTempVal(c.tempC, prefs.temp), "", opts.noColor)}(${colorTemp(fmtTempVal(c.feelsLikeC, prefs.temp), "", opts.noColor)}) ${tempUnitSym(prefs.temp)}`,
		`${color(windDirArrow(c.windDirDeg), 220, opts.noColor)} ${fmtWind(c.windKmh, prefs)}`,
		fmtVisibility(c.visibilityKm, prefs),
		`${fmtPrecip(c.precipitationMm, prefs)} | ${c.humidity}% RH`,
	];

	const artColor = c.isDay ? 226 : 33;
	const lines: string[] = [];
	for (let i = 0; i < 5; i++) {
		const a = color(art[i], artColor, opts.noColor);
		lines.push(`     ${a}     ${stats[i]}`);
	}
	return lines.join("\n");
}

export function formatFull(
	report: WeatherReport,
	prefs: UnitPrefs,
	opts: Options,
): string {
	const out: string[] = [];
	const head = locationHeader(report, opts);
	if (head) out.push(head.replace(/\n$/, ""));

	out.push("");
	out.push(renderCurrentBlock(report, prefs, opts));
	out.push("");

	if (opts.days >= 1) {
		const days = report.daily.slice(0, opts.days);
		for (let i = 0; i < days.length; i++) {
			out.push(renderDayBlock(days[i], i, prefs, opts));
		}
	}

	out.push("");
	out.push(
		`Location: ${report.location.lat.toFixed(3)}, ${report.location.lon.toFixed(3)} (${report.location.timezone})`,
	);
	return out.join("\n") + "\n";
}

export function formatNotFound(query: string): string {
	return [
		"",
		"  ╭─────────────────────────────────────╮",
		"  │  404  Location not found            │",
		"  ╰─────────────────────────────────────╯",
		"",
		`  Sorry, we could not find: "${query}"`,
		"",
		"  Try:",
		"    /Tokyo",
		"    /New+York",
		"    /35.68,139.69     (lat,lon)",
		"    /?lat=35.68&lon=139.69",
		"",
	].join("\n");
}

// Re-exports for callers that want the unit helpers from a single place
export { fmtTemp, fmtWind };
