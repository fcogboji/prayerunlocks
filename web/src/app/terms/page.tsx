import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-16 text-ink">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-muted hover:text-ink">
          ← Back to Steadfast
        </Link>
        <h1 className="mt-8 text-4xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-muted">Last updated: July 2026</p>

        <div className="prose prose-neutral mt-10 max-w-none space-y-6 text-muted">
          <section>
            <h2 className="text-xl font-semibold text-ink">Agreement</h2>
            <p>
              By using Steadfast you agree to these terms. If you do not agree,
              do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">The service</h2>
            <p>
              Steadfast helps you build daily spiritual habits, connect with
              accountability partners, and participate in church groups. The AI
              Bible coach provides general faith guidance — not professional
              counselling, medical, or pastoral care.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Accounts</h2>
            <p>
              You are responsible for your account security. You must provide
              accurate information and be at least 13 years old (16 in the UK
              where applicable without parental consent).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Subscriptions</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Premium is billed at $4.99/month via Stripe unless stated otherwise</li>
              <li>Subscriptions renew automatically until cancelled</li>
              <li>
                Cancel anytime via the billing portal linked from your dashboard
                or by contacting support@steadfast.app
              </li>
              <li>Refunds are handled case-by-case within 14 days of purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Acceptable use</h2>
            <p>
              Do not harass others, send abusive nudges, or misuse group leader
              tools. We may suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Limitation of liability</h2>
            <p>
              Steadfast is provided &quot;as is&quot;. We are not liable for
              indirect damages. Our total liability is limited to fees paid in
              the 12 months before a claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">Contact</h2>
            <p>Questions: support@steadfast.app</p>
          </section>
        </div>
      </article>
    </div>
  );
}
