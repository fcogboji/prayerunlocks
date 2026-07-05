import { Webhook } from "svix";
import { headers } from "next/headers";
import { logEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } =
      event.data;
    const email = email_addresses[0]?.email_address;

    if (email) {
      const existing = await prisma.user.findUnique({ where: { clerkId: id } });
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          imageUrl: image_url,
        },
        create: {
          clerkId: id,
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          imageUrl: image_url,
        },
      });
      if (event.type === "user.created" && !existing) {
        const user = await prisma.user.findUnique({ where: { clerkId: id } });
        if (user) void logEvent("sign_up", { userId: user.id });
      }
    }
  }

  if (event.type === "user.deleted") {
    await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
  }

  return new Response("OK", { status: 200 });
}
