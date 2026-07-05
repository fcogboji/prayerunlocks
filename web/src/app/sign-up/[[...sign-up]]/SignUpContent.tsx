"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpContent() {
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const group = searchParams.get("group");

  const params = new URLSearchParams();
  if (invite) params.set("invite", invite);
  if (group) params.set("group", group);
  const query = params.toString();
  const redirectUrl = query ? `/dashboard?${query}` : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        {(invite || group) && (
          <div className="mb-6 rounded-2xl border border-line bg-white p-4 text-center">
            <p className="text-sm font-semibold text-sage">You&apos;ve been invited</p>
            <p className="mt-1 text-sm text-muted">
              {group
                ? "Create your account to join your church group on Steadfast."
                : "Create your account to connect with your accountability partner."}
            </p>
          </div>
        )}
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  );
}
