import { z } from "zod";
import { logEvent } from "@/lib/analytics";
import { handleApiError, jsonOk } from "@/lib/api";

const trackSchema = z.object({
  type: z.enum(["page_view", "sign_up"]),
  path: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const body = trackSchema.parse(await request.json());
    await logEvent(body.type, { path: body.path ?? "/" });
    return jsonOk({ tracked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
