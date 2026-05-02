import type { Route } from "./+types/weather-splat";
import { handleTextRequest } from "@/lib/text-handler";

export async function loader({ request, params }: Route.LoaderArgs) {
	return handleTextRequest(request, params["*"] ?? "");
}
