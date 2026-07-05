import { z } from "zod";
import { NudgeType } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import {
  createChurchGroup,
  getGroupDetails,
  getUserGroups,
  GroupError,
  joinChurchGroup,
  nudgeGroupMember,
} from "@/lib/groups";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("id");

    if (groupId) {
      const group = await getGroupDetails(groupId, user.id);
      return jsonOk(group);
    }

    const groups = await getUserGroups(user.id);
    return jsonOk({ groups });
  } catch (error) {
    if (error instanceof GroupError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  churchName: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = createSchema.parse(await request.json());
    const group = await createChurchGroup(user, body.name, body.churchName);

    return jsonOk({
      group: {
        id: group.id,
        name: group.name,
        churchName: group.churchName,
        inviteCode: group.inviteCode,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/group/${group.inviteCode}`,
      },
    });
  } catch (error) {
    if (error instanceof GroupError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}

const joinSchema = z.object({
  inviteCode: z.string().min(1),
});

export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { inviteCode } = joinSchema.parse(await request.json());
    const result = await joinChurchGroup(user, inviteCode);

    return jsonOk({
      group: {
        id: result.group.id,
        name: result.group.name,
        churchName: result.group.churchName,
        inviteCode: result.group.inviteCode,
      },
      alreadyMember: result.alreadyMember,
      message: result.alreadyMember
        ? "You are already in this group"
        : `Welcome to ${result.group.name}`,
    });
  } catch (error) {
    if (error instanceof GroupError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}

const nudgeSchema = z.object({
  groupId: z.string(),
  memberId: z.string(),
  type: z.nativeEnum(NudgeType).optional(),
  message: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { groupId, memberId, type, message } = nudgeSchema.parse(
      await request.json(),
    );

    const nudge = await nudgeGroupMember(
      groupId,
      user.id,
      memberId,
      type,
      message,
    );

    return jsonOk({ nudge });
  } catch (error) {
    if (error instanceof GroupError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
