import { requireCurrentUser } from "@/lib/auth";
import { getInsightsForUser } from "@/lib/insights";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const stats = await getInsightsForUser(user);
    return jsonOk(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
