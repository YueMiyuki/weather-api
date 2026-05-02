import type { Lang } from "./i18n";
import { isLang } from "./i18n";

/**
 * Query option set. Supports concatenated single-letter flags
 * (e.g. `?qTn`) plus the usual `?key=value` pairs and an `Accept-Language` hint.
 */
export interface Options {
	// forecast horizon: 0=current only, 1..7=days
	days: number;
	// narrow view: only morning + night
	narrow: boolean;
	// quiet: omit "Weather report" header line
	quiet: boolean;
	// super-quiet: omit header AND city name
	superQuiet: boolean;
	// T: strip ANSI colors
	noColor: boolean;
	// A: force ANSI even if the User-Agent is a browser
	forceColor: boolean;
	// d: restrict glyphs to ASCII subset
	dumb: boolean;
	// n: same as narrow (handled above)
	// p: pad output (no-op for plain text — kept for compatibility)
	pad: boolean;
	// unit prefs
	useImperial: boolean;
	useMetric: boolean;
	useMs: boolean;
	// language
	lang: Lang;
	// format string: undefined = full view; "1".."4" preset; otherwise a custom format
	format?: string;
}

const KNOWN_FLAG_LETTERS = "nqQTdpAumMP".split("");

export function parseOptions(
	query: URLSearchParams,
	acceptLang: string | null,
): Options {
	const opts: Options = {
		days: 3,
		narrow: false,
		quiet: false,
		superQuiet: false,
		noColor: false,
		forceColor: false,
		dumb: false,
		pad: false,
		useImperial: false,
		useMetric: false,
		useMs: false,
		lang: pickLang(query.get("lang"), acceptLang),
	};

	// A single-key, no-value query like `?qT` arrives as one entry whose key
	// is "qT" with empty value. Treat each char as a flag.
	for (const [key, val] of query.entries()) {
		if (val === "" && key.length > 1 && /^[0-9A-Za-z]+$/.test(key)) {
			for (const ch of key) applyFlag(opts, ch);
			continue;
		}
		if (val === "" && key.length === 1) {
			applyFlag(opts, key);
			continue;
		}
		if (key === "format") opts.format = val;
		if (key === "lang") opts.lang = pickLang(val, acceptLang);
		if (key === "day" || key === "days") {
			const n = Number.parseInt(val, 10);
			if (Number.isFinite(n)) opts.days = Math.min(7, Math.max(0, n));
		}
	}

	return opts;
}

function applyFlag(o: Options, ch: string): void {
	if (!KNOWN_FLAG_LETTERS.includes(ch)) return;
	switch (ch) {
		case "n":
			o.narrow = true;
			break;
		case "q":
			o.quiet = true;
			break;
		case "Q":
			o.quiet = true;
			o.superQuiet = true;
			break;
		case "T":
			o.noColor = true;
			break;
		case "d":
			o.dumb = true;
			break;
		case "p":
			o.pad = true;
			break;
		case "A":
			o.forceColor = true;
			break;
		case "u":
			o.useImperial = true;
			break;
		case "m":
			o.useMetric = true;
			break;
		case "M":
			o.useMs = true;
			break;
	}
}

function pickLang(explicit: string | null, accept: string | null): Lang {
	if (explicit) {
		const v = explicit.slice(0, 2).toLowerCase();
		if (isLang(v)) return v;
	}
	if (accept) {
		for (const part of accept.split(",")) {
			const code = part.trim().split(/[-;]/)[0]?.toLowerCase() ?? "";
			if (isLang(code)) return code;
		}
	}
	return "en";
}
