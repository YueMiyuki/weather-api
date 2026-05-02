import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/index.tsx"),
	route("openapi.json", "routes/openapi.ts"),
	route("health", "routes/health.ts"),
	route("image-response", "routes/image.tsx"),
	route("weather", "routes/weather-index.ts"),
	route("weather/*", "routes/weather-splat.ts"),
] satisfies RouteConfig;
