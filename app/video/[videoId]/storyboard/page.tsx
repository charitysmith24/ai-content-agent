"use client";

import { createOrGetVideo } from "@/actions/createOrGetVideo";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Doc } from "@/convex/_generated/dataModel";
import { FeatureFlag } from "@/features/flags";
import Usage from "@/components/Usage";
import VideoNavigation from "@/components/VideoNavigation";
import YoutubeVideoDetails from "@/components/YoutubeVideoDetails";
import ScriptSelection from "@/components/storyboard/ScriptSelection";
import StoryboardScenes from "@/components/storyboard/StoryboardScenes";
import SceneDetails from "@/components/storyboard/SceneDetails";
import VoiceoverPanel from "@/components/storyboard/VoiceoverPanel";
import { Id } from "@/convex/_generated/dataModel";

function StoryboardPage() {
  const params = useParams<{ videoId: string }>();
  const { videoId } = params;

  const { user } = useUser();
  const [video, setVideo] = useState<Doc<"videos"> | null | undefined>(
    undefined
  );
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchVideo = async () => {
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

  return (
    <div className="xl:container mx-auto mb-9 px-4 md:px-0">
      {/* Video Navigation */}
      <div className="pt-8">
        <VideoNavigation videoId={videoId} />
      </div>
      
      <div className="flex flex-col gap-6 pt-4">
        {/* Header */}
        <div className="flex flex-row md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Script-to-Storyboard Workspace</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Transform your scripts into complete storyboards with images and voice-overs
            </p>
          </div>
          <div className="shrink-0">
            <Usage
              featureFlag={FeatureFlag.STORYBOARD_WORKSPACE}
              title="Storyboard Workspace"
            />
          </div>
        </div>

        {/* Video Info */}
{/*         <div className="max-h-[750px]border border-primary/70 dark:border-primary/50 rounded-xl p-4">
          <YoutubeVideoDetails videoId={videoId} />
        </div> */}

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Script Selection */}
          <div className="lg:col-span-3 border border-primary/70 dark:border-primary/50 rounded-xl p-4 bg-white dark:bg-black/10">
            <ScriptSelection 
              videoId={videoId} 
              onSelectScript={(scriptId) => setSelectedScriptId(scriptId)} 
              selectedScriptId={selectedScriptId}
            />
          </div>

          {/* Middle Panel - Storyboard Scenes */}
          <div className="lg:col-span-5 border border-primary/70 dark:border-primary/50 rounded-xl p-4 bg-white dark:bg-black/10">
            <StoryboardScenes 
              scriptId={selectedScriptId}
              onSelectScene={(sceneId: string) => setSelectedSceneId(sceneId)}
              selectedSceneId={selectedSceneId}
            />
          </div>

          {/* Right Panel - Scene Details & Voice Over */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Scene Details with Image */}
            <div className="border border-primary/70 dark:border-primary/50 rounded-xl p-4 bg-white dark:bg-black/10">
              <SceneDetails 
                sceneId={selectedSceneId}
                scriptId={selectedScriptId}
                videoId={videoId}
              />
            </div>

            {/* Voice Over Panel */}
            <div className="border border-primary/70 dark:border-primary/50 rounded-xl p-4 bg-white dark:bg-black/10">
              <VoiceoverPanel 
                sceneId={selectedSceneId}
                scriptId={selectedScriptId}
                videoId={videoId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryboardPage; 