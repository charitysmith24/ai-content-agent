import AgentPulse from "@/components/AgentPulse";
import { FooterWrapper } from "@/components/FooterWrapper";
import YoutubeVideoForm from "@/components/YoutubeVideoForm";
import { Brain, ImageIcon, MessageSquare, Sparkles, Video } from "lucide-react";
//import { HeroSectionBlock } from "@/components/HeroSectionBlock";

const steps = [
  {
    title: "1. Connect Your Content",
    description:
      "Share your Youtube video URL and let your agent get to work. No need to upload or download anything.",
    icon: Video,
  },
  {
    title: "2. AI Agent Analysis",
    description:
      "Your personal agent analyzes every aspect of your video content. Get detailed insights and recommendations.",
    icon: Brain,
  },
  {
    title: "3. Receive Intelligence Reports",
    description:
      "Get actionable insights, transcriptions, and recommendations to improve your video content.",
    icon: MessageSquare,
  },
];

const features = [
  {
    title: "AI Analysis",
    description:
      "Get deep insights into your video content with our advanced AI analysis tools. Understand viewer engagement, sentiment, and more.",
    icon: Brain,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    title: "Smart Transcription",
    description:
      "Get accurate transcriptions of your videos. Perfect for creating subtitles, blog posts, or repurposing content.",
    icon: MessageSquare,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    title: "Thumbnail Generator",
    description:
      "Generate eye-catching thumbnails using AI. Boost your click-through rates with compelling visuals and get more views.",
    icon: ImageIcon,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    title: "Title Generation",
    description:
      "Create attention-grabbing, SEO-optimized titles for your videos using AI. Maximize views with titles that resonate with your audience.",
    icon: MessageSquare,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Shot Script",
    description:
      "Get detailed, step-by-step instructions to recreate viral videos. Learn shooting techniques, camera angles, and editing tips from successful content.",
    icon: Video,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Discuss with Your AI Agent",
    description:
      "Engage in deep conversations about your content strategy, brainstorm ideas, and unlock new creative possibilities with your AI your AI agent companion.",
    icon: Sparkles,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="h-3/4 py-20 bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-10 text-center mb-12">
            <AgentPulse size="large" color="primary" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Meet Your Personal{" "}
              <span className="bg-gradient-to-r from-primary to-rose-800 bg-clip-text text-transparent">
                AI Content Agent
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform your video content with AI-powered analysis,
              transcription, and insights. Get started in seconds.
            </p>

            {/* YoutubeVideoForm */}
            <YoutubeVideoForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white dark:bg-black/90">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col items-center gap-10 text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Features for Content Creators
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Cards */}
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/0 p-6 rounded-xl border border-primary/20 hover:border-rose-600 transition-all duration-300"
                  >
                    <div
                      className={`size-12 rounded-lg flex items-center justify-center mb-4 ${feature.iconBg}`}
                    >
                      <Icon className={`size-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-white">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {/* How it works section*/}
      <section className="py-32 bg-white dark:bg-black/90">
        <div className="container mx-auto px-4 pb-12 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Meet Your AI Agent in 3 Simple Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step Cards */}
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/0 p-6 rounded-xl border border-primary/20 hover:border-rose-600 transition-all duration-300"
                >
                  <div className="size-16 bg-gradient-to-r from-primary to-rose-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Icon className={`size-8 text-white`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-white">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <FooterWrapper />
    </div>
  );
}
