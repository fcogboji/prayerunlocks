import { createApiClient } from "./api";
import { deleteStoredItem, getStoredItem, setStoredItem } from "./storage";

const PARTNER_KEY = "steadfast_partner_invite";
const GROUP_KEY = "steadfast_group_invite";

export async function savePartnerInvite(code: string) {
  await setStoredItem(PARTNER_KEY, code);
}

export async function saveGroupInvite(code: string) {
  await setStoredItem(GROUP_KEY, code);
}

export async function acceptPendingInvites(getToken: () => Promise<string | null>) {
  const partnerCode = await getStoredItem(PARTNER_KEY);
  const groupCode = await getStoredItem(GROUP_KEY);

  if (!partnerCode && !groupCode) return null;

  try {
    const api = createApiClient(getToken);
    const res = await api.post<{
      message?: string;
      partner?: { partner: { name: string } };
      group?: { name: string };
    }>("/api/invite/accept", {
      inviteCode: partnerCode ?? undefined,
      groupCode: groupCode ?? undefined,
    });

    if (partnerCode) await deleteStoredItem(PARTNER_KEY);
    if (groupCode) await deleteStoredItem(GROUP_KEY);

    return res.data;
  } catch {
    return null;
  }
}
