import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  cookieStore.set("partner_invite", code, {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });

  redirect(`/sign-up?invite=${encodeURIComponent(code)}`);
}

export function generateMetadata() {
  return {
    title: "Join Steadfast — Walk with a partner",
  };
}
