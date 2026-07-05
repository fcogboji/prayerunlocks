import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-16 text-ink">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-muted hover:text-ink">
          ← Back to Steadfast
        </Link>
        <h1 className="mt-8 text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-muted">Last updated: July 2026</p>

        <div className="prose prose-neutral mt-10 max-w-none space-y-6 text-muted">
          <section>
            <h2 className="text-xl font-semibold text-ink">Who we are</h2>
            <p>
              Steadfast (&quot;we&quot;, &quot;us&quot;) provides a Christian habit and
              accountability app. Contact: privacy@steadfast.app
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Data we collect</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Account information (name, email) via Clerk authentication</li>
              <li>Daily habit completion records and streaks</li>
              <li>Partner and church group membership</li>
              <li>Encouragement messages (&quot;nudges&quot;) you send or receive</li>
              <li>AI coach conversation history (Premium users)</li>
              <li>Push notification tokens (if you enable notifications)</li>
              <li>Payment status via Stripe (we do not store card details)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">How we use your data</h2>
            <p>
              We use your data to run the app: track habits, show progress to
              accountability partners and group leaders you choose, deliver
              notifications, and provide Premium features such as the AI Bible
              coach. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Sharing</h2>
            <p>
              Your daily progress is visible to partners and church group members
              you connect with. We use third-party processors: Clerk (auth),
              Stripe (payments), OpenAI (AI coach), and hosting providers. Each
              operates under their own privacy terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Retention & deletion</h2>
            <p>
              You may delete your account by contacting us. We will remove your
              personal data within 30 days, except where law requires retention.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Your rights (UK GDPR)</h2>
            <p>
              You may request access, correction, or deletion of your data, or
              object to processing, by emailing privacy@steadfast.app.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
