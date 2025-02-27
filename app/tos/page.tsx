import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function Page() {
  return (
    <main className="mx-auto max-w-prose space-y-6 p-3 py-6">
      <h1 className="text-center text-2xl font-bold">Terms of Service</h1>
      <p className="text-center text-sm text-muted-foreground">
        Effective Date: [Insert Date]
      </p>
      <p>
        Welcome to [Your AI YouTube Video Agent Name]. These Terms of Service
        {"Terms"} govern your use of our website and services, including any
        paid subscription plans. By accessing or using [Your Service Name]{" "}
        {"the Service"}, you agree to be bound by these Terms. If you do not
        agree to these Terms, do not use the Service.
      </p>

      <h2 className="text-xl font-semibold">1. Overview</h2>
      <p>
        [Your AI YouTube Video Agent] is a SaaS platform that provides
        AI-powered tools for video content creators. Our services include
        AI-based video analysis, smart transcription, thumbnail generation,
        title optimization, script generation, and creative assistance. We offer
        both a free tier and paid subscription plans {"Paid Plans"}. Payments
        for Paid Plans are processed securely through Stripe.
      </p>

      <h2 className="text-xl font-semibold">2. Eligibility</h2>
      <p>
        You must be at least 18 years old and capable of entering into legally
        binding contracts to use this Service. By accessing the Service, you
        confirm that you meet this eligibility requirement.
      </p>

      <h2 className="text-xl font-semibold">3. Account Registration</h2>
      <p>
        To access certain features of the Service, including Paid Plans, you
        must create an account. When registering, you agree to provide accurate
        and current information. You are responsible for maintaining the
        security of your account. We are not liable for any loss or damage
        resulting from unauthorized access to your account.
      </p>

      <h2 className="text-xl font-semibold">4. Free Tier</h2>
      <p>
        We offer a free tier of the Service that provides limited access to
        AI-powered tools. Users on the free tier can perform up to 5 AI video
        analyses and receive up to 5 transcriptions. Upgrading to a Paid Plan
        unlocks additional features and higher usage limits.
      </p>

      <h2 className="text-xl font-semibold">5. Paid Subscription Plans</h2>
      <p>
        If you choose to upgrade to a Paid Plan, you must provide payment
        details via Stripe. By subscribing, you agree to the following:
      </p>
      <ul className="list-inside list-disc">
        <li>
          <strong>Subscription Fees:</strong> Fees are billed on a recurring
          basis (monthly or annually) based on the plan selected. Prices are
          subject to change with prior notice.
        </li>
        <li>
          <strong>Payment Method:</strong> A valid payment method is required
          for subscription. Your subscription will automatically renew unless
          you cancel before the renewal date.
        </li>
        <li>
          <strong>Refund Policy:</strong> We do not offer refunds for processed
          payments. However, you may cancel your subscription at any time, and
          access will remain available until the end of the billing cycle.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">6. Cancelation of Subscription</h2>
      <p>
        You may cancel your subscription at any time through your account
        settings. Your access to Paid Plan features will continue until the
        current billing cycle ends.
      </p>

      <h2 className="text-xl font-semibold">
        7. Changes to Services and Pricing
      </h2>
      <p>
        We reserve the right to modify or discontinue the Service (or any part
        of it) at any time, with or without notice. Price changes will not
        affect your current subscription period and will be communicated before
        taking effect.
      </p>

      <h2 className="text-xl font-semibold">8. License to Use the Service</h2>
      <p>
        We grant you a limited, non-exclusive, non-transferable, and revocable
        license to use the Service. You may not:
      </p>
      <ul className="list-inside list-disc">
        <li>
          Copy, modify, or distribute any part of the Service without
          authorization.
        </li>
        <li>Use the Service to build a competing product.</li>
        <li>Attempt unauthorized access to the Service.</li>
      </ul>

      <h2 className="text-xl font-semibold">9. Intellectual Property</h2>
      <p>
        All content, trademarks, and intellectual property related to [Your
        Service Name] are owned by us or our licensors. You agree not to
        infringe on these rights.
      </p>

      <h2 className="text-xl font-semibold">10. User Content</h2>
      <p>
        By using the Service, you grant us a non-exclusive, worldwide license to
        process, analyze, and enhance your content using AI solely for the
        purpose of providing the Service. You retain full ownership of your
        original video content.
      </p>

      <h2 className="text-xl font-semibold">11. Privacy Policy</h2>
      <p>
        Your privacy is important to us. Please review our Privacy Policy [link]
        to understand how we collect, use, and protect your personal
        information.
      </p>

      <h2 className="text-xl font-semibold">12. Third-Party Services</h2>
      <p>
        The Service may integrate with third-party platforms (e.g., YouTube,
        Stripe). We are not responsible for the terms or privacy policies of
        these third-party services.
      </p>

      <h2 className="text-xl font-semibold">13. Disclaimer of Warranties</h2>
      <p>
        The Service is provided on an {"as is"} and {"as available"} basis. We
        make no warranties, express or implied, regarding the accuracy of
        AI-generated content, the effectiveness of marketing strategies, or the
        uninterrupted availability of the Service.
      </p>

      <h2 className="text-xl font-semibold">14. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, we shall not be liable for any
        indirect, incidental, consequential, or punitive damages, including loss
        of revenue, audience engagement, or brand reputation arising from the
        use of the Service.
      </p>

      <h2 className="text-xl font-semibold">15. Governing Law</h2>
      <p>
        These Terms are governed by the laws of [Insert Jurisdiction]. Any
        disputes arising from these Terms will be handled in the courts of
        [Insert Location].
      </p>

      <h2 className="text-xl font-semibold">16. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. Changes will be posted on
        this page, and your continued use of the Service constitutes acceptance
        of the revised Terms.
      </p>

      <h2 className="text-xl font-semibold">17. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at
        [Insert Contact Information].
      </p>

      <p>
        By using [Your AI YouTube Video Agent Name], you acknowledge that you
        have read, understood, and agree to these Terms of Service.
      </p>
    </main>
  );
}
