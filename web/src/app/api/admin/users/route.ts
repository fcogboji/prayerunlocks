import { AdminError, getAdminUsers, requireAdmin } from "@/lib/admin";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const data = await getAdminUsers(page);
    return jsonOk(data);
  } catch (error) {
    if (error instanceof AdminError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
