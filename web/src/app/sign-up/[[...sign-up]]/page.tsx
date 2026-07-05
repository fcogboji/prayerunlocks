import { Suspense } from "react";
import SignUpContent from "./SignUpContent";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper">
          <p className="text-muted">Loading…</p>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
