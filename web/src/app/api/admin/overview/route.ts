import { AdminError, getAdminOverview, requireAdmin } from "@/lib/admin";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const data = await getAdminOverview();
    return jsonOk(data);
  } catch (error) {
    if (error instanceof AdminError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
