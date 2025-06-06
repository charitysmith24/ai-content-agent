"use client";

import { createOrGetVideo } from "@/actions/createOrGetVideo";
import AiAgentChat from "@/components/AiAgentChat";
import ScriptGeneration from "@/components/ScriptGeneration";
import ThumbnailGeneration from "@/components/ThumbnailGeneration";
import TitleGeneration from "@/components/TitleGeneration";
import Transcription from "@/components/Transcription";
import Usage from "@/components/Usage";
import VideoNavigation from "@/components/VideoNavigation";
import YoutubeVideoDetails from "@/components/YoutubeVideoDetails";
import { Doc } from "@/convex/_generated/dataModel";
import { FeatureFlag } from "@/features/flags";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function AnalysisPage() {
  const params = useParams<{ videoId: string }>();
  const { videoId } = params;

  const { user } = useUser();
  const [video, setVideo] = useState<Doc<"videos"> | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (!user?.id) return;

    const fetchVideo = async () => {
      // Analyse the video (add video to db here)
      const response = await createOrGetVideo(videoId as string, user.id);
      if (!response.success) {
        toast.error("Error creating or getting video", {
          description: response.error,
          duration: 10000,
        });
      } else {
        setVideo(response.data!);
      }
    };

    fetchVideo();
  }, [videoId, user]);

  const VideoTranscriptionStatus =
    video === undefined ? (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-sm text-gray-700">Loading...</span>
      </div>
    ) : !video ? (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        <p className="text-sm text-amber-700">
          This is your first time analyzing this video. <br />
          <span className="font-semibold">
            (1 Analysis token is being used!)
          </span>
        </p>
      </div>
    ) : (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <p className="text-sm text-green-700">
          Analysis exists for this video - no additional tokens needed in future
          calls! <br />
        </p>
      </div>
    );

  return (
    <div className="container mx-auto mb-9 px-4">
      {/* Video Navigation */}
      <div className="pt-8">
        <VideoNavigation videoId={videoId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
        {/* Left Side */}
        <div className="order-2 lg:order-1 flex flex-col gap-4 px-3 md:px-6 bg-white dark:bg-black/0 lg:border-r border-gray-100 dark:border-primary/50">
          {/* Analysis Section */}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 rounded-xl mb-4 px-2 py-2">
            <Usage
              featureFlag={FeatureFlag.ANALYSE_VIDEO}
              title="Analyse Video"
            />
            {/* Video Transcription status */}
            {VideoTranscriptionStatus}
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
          {/* Script Generation */}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
            <ScriptGeneration videoId={videoId} />
          </div>
          {/* Transcription */}
          <div className="flex flex-col gap-4 border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
            <Transcription videoId={videoId} />
          </div>
        </div>

        {/* Right Side */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20 h-[500px] md:h-[calc(100vh-6rem)] px-3 md:px-6">
          {/* AI CHAT */}
          <AiAgentChat videoId={videoId} />
        </div>
      </div>
    </div>
  );
}
export default AnalysisPage;
