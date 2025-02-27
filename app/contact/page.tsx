import { Bug, MessageCircleCode, Computer } from "lucide-react";

export default function Contact() {
  return (
    <div className="isolate bg-white dark:bg-black/90 px-auto py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-3xl sm:text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-balance text-gray-900 dark:text-white sm:text-5xl">
          Get in Touch
        </h2>
        <p className="mt-2 text-lg/8 text-gray-600 dark:text-white/80">
          Have questions about our AI-powered YouTube content creation tools?
          Whether you&apos;re looking for sales, technical help, or want to
          report an issue, we&apos;re here to help.
        </p>
      </div>
      <div className="mx-auto mt-20 max-w-lg space-y-16">
        {/* Sales Support */}
        <div className="flex gap-x-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-700">
            <MessageCircleCode
              aria-hidden="true"
              className="size-6 text-white"
            />
          </div>
          <div>
            <h3 className="text-base/7 font-semibold text-gray-900 dark:text-white/90">
              Sales & Inquiries
            </h3>
            <p className="mt-2 text-base/7 text-gray-600 dark:text-white/80">
              Looking to level up your YouTube content creation with AI? Our
              sales team can help you find the best plan for your needs, whether
              you&apos;re an independent creator or a growing brand.
            </p>
            <p className="mt-4 text-sm/6 font-semibold">
              <a href="#" className="text-rose-700">
                Contact Sales <span aria-hidden="true">&rarr;</span>
              </a>
            </p>
          </div>
        </div>

        {/* Bug Reports */}
        <div className="flex gap-x-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-700">
            <Bug aria-hidden="true" className="size-6 text-white" />
          </div>
          <div>
            <h3 className="text-base/7 font-semibold text-gray-900 dark:text-white/90">
              Report a Bug
            </h3>
            <p className="mt-2 text-base/7 text-gray-600 dark:text-white/80">
              Found something that&apos;s not working as expected? Help us
              improve by reporting any issues or glitches with our AI-powered
              tools, and we&apos;ll get it fixed ASAP!
            </p>
            <p className="mt-4 text-sm/6 font-semibold">
              <a href="#" className="text-rose-700">
                Report an Issue <span aria-hidden="true">&rarr;</span>
              </a>
            </p>
          </div>
        </div>

        {/* Technical Support */}
        <div className="flex gap-x-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-700">
            <Computer aria-hidden="true" className="size-6 text-white" />
          </div>
          <div>
            <h3 className="text-base/7 font-semibold text-gray-900 dark:text-white/90">
              Technical Support
            </h3>
            <p className="mt-2 text-base/7 text-gray-600 dark:text-white/80">
              Need assistance using our AI tools for video analysis, script
              generation, or thumbnails? Our support team and community are here
              to help you every step of the way.
            </p>
            <p className="mt-4 text-sm/6 font-semibold">
              <a href="#" className="text-rose-700">
                Join Our Discord <span aria-hidden="true">&rarr;</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
