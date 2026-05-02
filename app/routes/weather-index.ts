import type { Route } from "./+types/weather-index";
import { handleTextRequest } from "@/lib/text-handler";

export async function loader({ request }: Route.LoaderArgs) {
	return handleTextRequest(request, "");
}
