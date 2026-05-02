export function getClientIp(request: Request): string {
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	const real = request.headers.get("x-real-ip");
	if (real) return real.trim();
	const cf = request.headers.get("cf-connecting-ip");
	if (cf) return cf.trim();
	return "127.0.0.1";
}

const PRIVATE_RANGES = [
	/^127\./,
	/^10\./,
	/^192\.168\./,
	/^172\.(1[6-9]|2\d|3[01])\./,
	/^::1$/,
	/^fc00:/i,
	/^fe80:/i,
];

export function isPrivateIp(ip: string): boolean {
	return PRIVATE_RANGES.some((r) => r.test(ip));
}
