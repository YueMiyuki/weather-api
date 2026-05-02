// Strict CSS color parsing for query-param overrides
// Accepts only #rgb / #rrggbb / #rrggbbaa to avoid url()/expression injection
// in inline styles. Returns null if invalid or missing
export function parseColor(input: string | null | undefined): string | null {
	if (!input) return null;
	const v = input.trim();
	if (!/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return null;
	return v.toLowerCase();
}

// Lighten or darken a hex color toward a target lightness for derived "subtle"
// text. amount in [-1, 1]; positive blends toward white, negative toward black
export function shiftColor(hex: string, amount: number): string {
	const m = /^#([0-9a-f]{6})$/i.exec(hex) ?? /^#([0-9a-f]{3})$/i.exec(hex);
	if (!m) return hex;
	const raw = m[1];
	const full =
		raw.length === 3
			? raw
					.split("")
					.map((c) => c + c)
					.join("")
			: raw;
	const r = parseInt(full.slice(0, 2), 16);
	const g = parseInt(full.slice(2, 4), 16);
	const b = parseInt(full.slice(4, 6), 16);
	const target = amount >= 0 ? 255 : 0;
	const t = Math.abs(amount);
	const mix = (c: number) => Math.round(c + (target - c) * t);
	const toHex = (n: number) => n.toString(16).padStart(2, "0");
	return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
