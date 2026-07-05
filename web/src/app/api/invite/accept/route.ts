import { cookies } from "next/headers";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { joinChurchGroup, GroupError } from "@/lib/groups";
import { acceptPartnerInvite, PartnerInviteError } from "@/lib/partners";

const schema = z.object({
  inviteCode: z.string().min(1).optional(),
  groupCode: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = schema.parse(await request.json().catch(() => ({})));
    const cookieStore = await cookies();

    const partnerCode = body.inviteCode ?? cookieStore.get("partner_invite")?.value;
    const groupCode = body.groupCode ?? cookieStore.get("group_invite")?.value;

    if (!partnerCode && !groupCode) {
      return jsonError("No invite code provided", 400);
    }

    let partnerResult: Awaited<ReturnType<typeof acceptPartnerInvite>> | undefined;
    let groupResult: Awaited<ReturnType<typeof joinChurchGroup>> | undefined;
    const messages: string[] = [];

    if (partnerCode) {
      try {
        partnerResult = await acceptPartnerInvite(user, partnerCode);
        cookieStore.delete("partner_invite");
        messages.push(
          partnerResult.alreadyLinked
            ? `Already connected with ${partnerResult.partner.name}`
            : `Connected with ${partnerResult.partner.name}`,
        );
      } catch (error) {
        if (error instanceof PartnerInviteError) {
          messages.push(error.message);
        } else {
          throw error;
        }
      }
    }

    if (groupCode) {
      try {
        groupResult = await joinChurchGroup(user, groupCode);
        cookieStore.delete("group_invite");
        messages.push(
          groupResult.alreadyMember
            ? `Already in ${groupResult.group.name}`
            : `Joined ${groupResult.group.name}`,
        );
      } catch (error) {
        if (error instanceof GroupError) {
          messages.push(error.message);
        } else {
          throw error;
        }
      }
    }

    return jsonOk({
      partner: partnerResult,
      group: groupResult
        ? {
            id: groupResult.group.id,
            name: groupResult.group.name,
            alreadyMember: groupResult.alreadyMember,
          }
        : undefined,
      message: messages.join(" · "),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
