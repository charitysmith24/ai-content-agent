import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function Privacy() {
  return (
    <main className="mx-auto max-w-prose space-y-6 p-3 py-6">
      <h1 className="text-center text-2xl font-bold">Privacy Policy</h1>
      <p className="text-center text-sm text-muted-foreground">
        Effective Date: [Insert Date]
      </p>
      <p>
        Welcome to [Your AI YouTube Video Agent Name]. Your privacy is important
        to us, and we are committed to protecting the personal information you
        share with us. This Privacy Policy outlines how we collect, use, and
        protect your data when using our AI-powered video content services.
      </p>

      <h2 className="text-xl font-semibold">1. Information We Collect</h2>
      <p>
        We collect the following types of information to provide and improve our
        services:
      </p>
      <ul className="list-inside list-disc">
        <li>
          <strong>Account Information:</strong> When you sign up using Clerk
          authentication, we collect your name, email, and authentication
          credentials.
        </li>
        <li>
          <strong>AI Content Processing Data:</strong> Any video-related data
          submitted for analysis, transcription, or enhancement is temporarily
          stored and processed to deliver AI-powered insights.
        </li>
        <li>
          <strong>Payment Information:</strong> If you subscribe to a paid plan,
          payment details are securely processed by Stripe. We do not store
          credit card details.
        </li>
        <li>
          <strong>Usage Data:</strong> We collect interaction logs, including
          how you use our AI tools, to improve performance and user experience.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
      <p>We use the collected data for the following purposes:</p>
      <ul className="list-inside list-disc">
        <li>To authenticate users securely using Clerk.</li>
        <li>
          To process AI-driven video analysis, transcriptions, and content
          enhancements.
        </li>
        <li>To improve and personalize the user experience.</li>
        <li>To handle subscription management and billing via Stripe.</li>
        <li>
          To comply with legal obligations and prevent fraudulent activity.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">3. Data Security</h2>
      <p>
        We take data security seriously and implement industry-standard
        safeguards to protect your information. Our authentication system,
        powered by Clerk, ensures secure access and identity verification.
        Payment transactions are encrypted and handled by Stripe.
      </p>

      <h2 className="text-xl font-semibold">4. Data Retention</h2>
      <p>
        Your personal information is retained as long as necessary to provide
        our services and comply with legal obligations. AI-generated content and
        processing data are stored temporarily and deleted after processing,
        unless you save it to your account.
      </p>

      <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
      <p>
        Our Service integrates with third-party providers such as Clerk for
        authentication and Stripe for payments. These providers have their own
        privacy policies, which govern how they handle your data:
      </p>
      <ul className="list-inside list-disc">
        <li>
          <a
            href="https://clerk.dev/privacy"
            className="text-rose-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clerk Privacy Policy
          </a>
        </li>
        <li>
          <a
            href="https://stripe.com/privacy"
            className="text-rose-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stripe Privacy Policy
          </a>
        </li>
      </ul>

      <h2 className="text-xl font-semibold">6. Your Rights and Choices</h2>
      <p>You have the following rights regarding your personal data:</p>
      <ul className="list-inside list-disc">
        <li>
          Access and update your account details through your profile settings.
        </li>
        <li>Request data deletion by contacting our support team.</li>
        <li>Opt out of marketing emails via unsubscribe links.</li>
      </ul>

      <h2 className="text-xl font-semibold">7. Children&apos;s Privacy</h2>
      <p>
        Our services are not intended for users under the age of 18. We do not
        knowingly collect personal information from children.
      </p>

      <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        posted on this page, and the effective date will be updated accordingly.
        Your continued use of our services constitutes acceptance of the revised
        policy.
      </p>

      <h2 className="text-xl font-semibold">9. Contact Us</h2>
      <p>
        If you have any questions regarding this Privacy Policy, please contact
        us at [Insert Contact Information].
      </p>

      <p>
        By using [Your AI YouTube Video Agent Name], you acknowledge that you
        have read, understood, and agree to this Privacy Policy.
      </p>
    </main>
  );
}
