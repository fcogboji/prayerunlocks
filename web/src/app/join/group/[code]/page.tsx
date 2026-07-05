import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  cookieStore.set("group_invite", code, {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });

  redirect(`/sign-up?group=${encodeURIComponent(code)}`);
}
