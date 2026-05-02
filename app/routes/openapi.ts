import type { Route } from "./+types/openapi";

function flagParam(letter: string, desc: string) {
	return {
		name: letter,
		in: "query" as const,
		required: false,
		schema: { type: "string" as const },
		description: desc,
	};
}

const COMMON_QUERY = [
	{
		name: "format",
		in: "query",
		required: false,
		schema: { type: "string" },
		description:
			"Preset 1..4 or custom %-format string. Codes: %c emoji, %C label, " +
			"%t temp, %f feels-like, %w wind, %h humidity, %l location, " +
			"%p precip, %P pressure, %u UV, %m moon emoji, %M moon day, " +
			"%D sunrise, %s sunset, %Z timezone.",
		examples: {
			oneline: { value: "1" },
			full: { value: "4" },
			custom: { value: "%l: %c %t %w %h" },
		},
	},
	{
		name: "lang",
		in: "query",
		required: false,
		schema: {
			type: "string",
			enum: [
				"en",
				"fr",
				"de",
				"es",
				"it",
				"pt",
				"ru",
				"zh",
				"ja",
				"ko",
				"nl",
				"pl",
				"tr",
				"uk",
			],
		},
		description: "Language for labels and condition names.",
	},
	{
		name: "lat",
		in: "query",
		required: false,
		schema: { type: "number" },
		description: "Explicit latitude (paired with lon).",
	},
	{
		name: "lon",
		in: "query",
		required: false,
		schema: { type: "number" },
		description: "Explicit longitude (paired with lat).",
	},
	{
		name: "day",
		in: "query",
		required: false,
		schema: { type: "integer", minimum: 0, maximum: 7, default: 3 },
		description:
			"Number of forecast days to show (0 = current weather only). " +
			"Also accepts `days=` as an alias.",
		example: 2,
	},
	flagParam("n", "Narrow view: only morning + night columns."),
	flagParam("q", "Quiet: drop the 'Weather report' header line."),
	flagParam("Q", "Super quiet: drop both header and city name."),
	flagParam("T", "No ANSI colors (plain text)."),
	flagParam(
		"A",
		"Force ANSI colors. By default the server only emits ANSI escapes " +
			"when the User-Agent looks like a terminal (curl, wget, httpie, ...).",
	),
	flagParam("d", "Restrict to ASCII glyphs (dumb terminal)."),
	flagParam("u", "USCS / imperial units (°F, mph, inches, mi)."),
	flagParam("m", "Metric units (default)."),
	flagParam("M", "Wind speed in m/s."),
	{
		name: "Combined flags",
		in: "query",
		required: false,
		schema: { type: "string" },
		description:
			"Single-letter flags can be concatenated. Example: `?qTn` = quiet + " +
			"no color + narrow.",
		example: "qTn",
	},
];

const TEXT_RESPONSES = {
	"200": {
		description: "Weather report (text/plain, may include ANSI escapes).",
		content: { "text/plain": { schema: { type: "string" } } },
	},
	"404": {
		description: "Location could not be geocoded.",
		content: { "text/plain": { schema: { type: "string" } } },
	},
	"429": {
		description: "Rate limit exceeded.",
		content: { "text/plain": { schema: { type: "string" } } },
	},
	"502": {
		description: "Upstream (Open-Meteo) error.",
		content: { "text/plain": { schema: { type: "string" } } },
	},
};

const SPEC = {
	openapi: "3.1.0",
	info: {
		title: "Weather API",
		version: "1.0.0",
		description:
			"Visual weather API. Returns ANSI text for terminals " +
			"and PNG OG cards for browsers / social previews. Powered by Open-Meteo.",
	},
	servers: [{ url: "/", description: "This server" }],
	tags: [
		{ name: "weather", description: "Weather data" },
		{ name: "image", description: "Generated images" },
		{ name: "system", description: "System endpoints" },
	],
	paths: {
		"/weather": {
			get: {
				tags: ["weather"],
				summary: "Weather at the caller's location",
				description:
					"Returns the multi-day text weather view for the IP " +
					"geolocated location of the caller. Use query flags to customize.",
				parameters: COMMON_QUERY,
				responses: TEXT_RESPONSES,
			},
		},
		"/weather/{location}": {
			get: {
				tags: ["weather"],
				summary: "Weather for a specific location",
				description:
					"Location can be a city name, `lat,lon` pair, or any Open-Meteo " +
					"geocodable string. `+` and `_` are treated as spaces; a leading " +
					"`~` is stripped.",
				parameters: [
					{
						name: "location",
						in: "path",
						required: true,
						schema: { type: "string" },
						examples: {
							city: { value: "Tokyo" },
							spaces: { value: "New+York" },
							latlon: { value: "35.68,139.69" },
							tilde: { value: "~Eiffel+Tower" },
						},
					},
					...COMMON_QUERY,
				],
				responses: TEXT_RESPONSES,
			},
		},
		"/image-response": {
			get: {
				tags: ["image"],
				summary: "PNG weather card (1200x630)",
				description:
					"Returns a PNG Open Graph card for the given location, rendered " +
					"with Takumi.",
				parameters: [
					{
						name: "location",
						in: "query",
						required: false,
						schema: { type: "string" },
						description:
							"Location (city, lat,lon, etc). Defaults to caller IP geolocation.",
						example: "Tokyo",
					},
					{
						name: "lat",
						in: "query",
						required: false,
						schema: { type: "number" },
					},
					{
						name: "lon",
						in: "query",
						required: false,
						schema: { type: "number" },
					},
					flagParam("u", "Use imperial units (°F, mph)."),
					{
						name: "bg",
						in: "query",
						required: false,
						schema: { type: "string", pattern: "^#([0-9a-fA-F]{3,8})$" },
						description:
							"Background color override. Hex only (#rgb, #rrggbb, " +
							"#rrggbbaa). Invalid values are ignored.",
						example: "#0f172a",
					},
					{
						name: "fg",
						in: "query",
						required: false,
						schema: { type: "string", pattern: "^#([0-9a-fA-F]{3,8})$" },
						description: "Text color override. Same hex rules as bg.",
						example: "#fef3c7",
					},
				],
				responses: {
					"200": {
						description: "PNG weather card.",
						content: {
							"image/png": { schema: { type: "string", format: "binary" } },
						},
					},
					"404": { description: "Location not found" },
					"429": { description: "Rate limit exceeded" },
				},
			},
		},
		"/health": {
			get: {
				tags: ["system"],
				summary: "Service health and metrics",
				responses: {
					"200": {
						description: "Health JSON",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										status: { type: "string", example: "ok" },
										version: { type: "string" },
										startedAt: { type: "string", format: "date-time" },
										uptimeMs: { type: "integer" },
										uptimeHuman: { type: "string" },
										requestIp: { type: "string" },
										rateLimit: { type: "object" },
										requestsToday: { type: "integer" },
										cache: { type: "object" },
										upstream: { type: "object" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/openapi.json": {
			get: {
				tags: ["system"],
				summary: "This OpenAPI 3.1 specification",
				responses: {
					"200": {
						description: "OpenAPI document",
						content: { "application/json": {} },
					},
				},
			},
		},
	},
};

export async function loader(_: Route.LoaderArgs) {
	return new Response(JSON.stringify(SPEC, null, 2), {
		status: 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=300",
		},
	});
}
