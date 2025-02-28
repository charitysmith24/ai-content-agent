"use client";

import ChatMessage from "@/components/ChatMessage";
import ThumbnailGeneration from "@/components/ThumbnailGeneration";
import TitleGeneration from "@/components/TitleGeneration";
import Transcription from "@/components/Transcription";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
// import Usage from "@/components/Usage";
import YoutubeVideoDetails from "@/components/YoutubeVideoDetails";
// import { FeatureFlag } from "@/features/flags";
import { useParams } from "next/navigation";

function AnalysisPage() {
  const params = useParams<{ videoId: string }>();
  const { videoId } = params;
  return (
    <div className="xl:container mx-auto px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-12">
        {/* Left Side */}
        <div className="order-2 lg:order-1 flex flex-col gap-4 px-6 bg-white dark:bg-black/0 lg:border-r border-gray-100 dark:border-primary/50">
          {/* Analysis Section */}
          {/* <div className="flex flex-col gap-4 border border-primary/0 dark:border-primary/50 rounded-xl"></div> */}
          {/* Youtube video Details */}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
            <YoutubeVideoDetails videoId={videoId} />
          </div>

          {/* Thumbnail Generation */}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
            <ThumbnailGeneration videoId={videoId} />
          </div>
          {/* Title Generation*/}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
            <TitleGeneration videoId={videoId} />
          </div>
          {/* Transcription */}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
            <Transcription videoId={videoId} />
          </div>
        </div>

        {/* Right Side */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20 h-[500px] md:h-[calc(100vh-6rem)] px-6">
          {/* AI CHAT */}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
            <VercelV0Chat />
          </div>
        </div>
      </div>
    </div>
  );
}
export default AnalysisPage;
