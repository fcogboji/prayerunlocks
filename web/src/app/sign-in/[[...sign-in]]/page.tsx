import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-[28rem]">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
