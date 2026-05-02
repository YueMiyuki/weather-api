import stringWidth from "string-width";

/**
 * Minimal ANSI 256-color helpers.
 * Pass `noColor=true` to all helpers to strip the codes.
 */

const ESC = "\x1b[";
export const RESET = `${ESC}0m`;

export function fg(code: number): string {
	return `${ESC}38;5;${code}m`;
}

export function color(text: string, code: number, noColor = false): string {
	if (noColor) return text;
	return `${fg(code)}${text}${RESET}`;
}

/**
 * Color a temperature value (in °C)
 * 226=yellow 220 214 208 202=orange/red, 27 33 39=cool blues.
 */
export function tempColor(c: number): number {
	if (c <= -15) return 21; // deep blue
	if (c <= -5) return 27;
	if (c <= 0) return 33;
	if (c <= 5) return 39;
	if (c <= 10) return 45;
	if (c <= 15) return 50;
	if (c <= 20) return 226;
	if (c <= 25) return 220;
	if (c <= 30) return 214;
	if (c <= 35) return 208;
	return 202;
}

export function colorTemp(
	value: number,
	suffix: string,
	noColor = false,
): string {
	// Color uses original Celsius scale by convention; callers can pre-convert
	// the displayed value but pass the °C-equivalent for the gradient
	const sign = value > 0 ? "+" : "";
	return color(
		`${sign}${Math.round(value)}°${suffix}`,
		tempColor(value),
		noColor,
	);
}

/**
 * Strip ANSI sequences (used for visible-width calculation)
 */
const ANSI_RE = /\x1b\[[0-9;]*m/g;
export function stripAnsi(s: string): string {
	return s.replace(ANSI_RE, "");
}

/**
 * Visible width: counts most chars as 1; common East-Asian / wide
 * symbols would need unicode-width but we don't ship that here.
 */
export function visibleWidth(s: string): number {
	return stringWidth(stripAnsi(s));
}

/** Pad a (possibly colored) string to `width` visible columns on the right. */
export function padRight(s: string, width: number): string {
	const w = visibleWidth(s);
	if (w >= width) return s;
	return s + " ".repeat(width - w);
}
