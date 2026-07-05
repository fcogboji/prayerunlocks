import { z } from "zod";
import { logEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

const waitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = waitlistSchema.parse(await request.json());

    const entry = await prisma.waitlistEntry.upsert({
      where: { email: body.email },
      update: { name: body.name, source: body.source ?? "landing" },
      create: {
        email: body.email,
        name: body.name,
        source: body.source ?? "landing",
      },
    });

    void logEvent("waitlist", {
      metadata: { source: body.source ?? "landing", email: body.email },
    });

    return jsonOk({ success: true, id: entry.id });
  } catch {
    return jsonError("Invalid email address", 400);
  }
}
