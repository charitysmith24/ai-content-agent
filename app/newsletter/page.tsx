import { CalendarDays, Hand } from "lucide-react";

export default function Newsletter() {
  return (
    <div className="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 lg:py-32 min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
          <div className="max-w-xl lg:max-w-lg">
            <h2 className="text-4xl font-semibold tracking-tight text-white">
              Stay Ahead of the Content Game
            </h2>
            <p className="mt-4 text-lg text-gray-300 prose lg:prose-lg">
              Join thousands of YouTube creators who are using AI to{" "}
              <span className="text-rose-700 font-bold">level up</span> {""}
              their content. Get expert insights, video growth strategies, and
              early access to new AI tools—delivered straight to your inbox!
            </p>
            <div className="mt-6 flex max-w-md gap-x-4">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                autoComplete="email"
                className="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-rose-700 sm:text-sm/6"
              />
              <button
                type="submit"
                className="flex-none rounded-md bg-rose-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
              >
                Subscribe
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-2">
            <div className="flex flex-col items-start">
              <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <CalendarDays
                  aria-hidden="true"
                  className="size-6 text-white"
                />
              </div>
              <dt className="mt-4 text-base font-semibold text-white">
                Weekly AI Tips & Insights
              </dt>
              <dd className="mt-2 text-base/7 text-gray-400">
                Discover new ways to{" "}
                <span className="text-rose-700">optimize your content</span>{" "}
                with AI-driven strategies, viral trends, and best practices for
                growing your{" "}
                <span className="italic text-rose-700">YouTube channel</span>.
              </dd>
            </div>
            <div className="flex flex-col items-start">
              <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <Hand aria-hidden="true" className="size-6 text-white" />
              </div>
              <dt className="mt-4 text-base font-semibold text-white">
                No Spam, Just Value
              </dt>
              <dd className="mt-2 text-base/7 text-gray-400">
                We <span className="text-rose-700">respect your inbox</span>.
                You&apos;ll only receive{" "}
                <span className="italic">high-quality content</span>, exclusive
                offers, and early access to our newest AI features — {""}
                <span className="italic text-rose-700">no fluff, no spam</span>.
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl xl:-top-6"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="aspect-1155/678 w-[72.1875rem] bg-linear-to-tr from-[#fd82b6] to-[#f50136] opacity-30"
        />
      </div>
    </div>
  );
}
