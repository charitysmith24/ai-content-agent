"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { PlusCircle, Layers, MessageSquare, Workflow, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FeatureFlag } from "@/features/flags";
import { useSchematicEntitlement } from "@schematichq/schematic-react";

interface StoryboardScenesProps {
  scriptId: string | null;
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
}

// Define a type for our scene data
interface Scene {
  _id: Id<"storyboard_scenes">;
  scriptId: Id<"scripts">;
  userId: string;
  videoId: string;
  sceneIndex: number;
  sceneContent: string;
  sceneName: string;
  contentType: string;
  emotion?: string;
  visualElements?: string[];
  imageId?: Id<"_storage">;
  voiceoverId?: Id<"voiceovers">;
  duration?: number;
  notes?: string;
  createdAt: number;
}

function StoryboardScenes({ scriptId, selectedSceneId, onSelectScene }: StoryboardScenesProps) {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { value: isStoryboardEnabled } = useSchematicEntitlement(
    FeatureFlag.STORYBOARD_WORKSPACE
  );
  
  // Use the proper API references now that they're registered
  const parseScriptIntoScenes = useMutation(api.storyboard.parseScriptIntoScenes);
  
  // Query to get scenes
  const scenes = useQuery(
    api.storyboard.getScenes,
    scriptId ? {
      scriptId: scriptId as Id<"scripts">,
      userId: user?.id ?? ""
    } : "skip"
  );
  
  // Query to get script details
  const scriptDetails = useQuery(
    api.scripts.getScriptById,
    scriptId ? {
      scriptId: scriptId as Id<"scripts">,
      userId: user?.id ?? ""
    } : "skip"
  );

  const generateStoryboard = async () => {
    if (!scriptId || !user?.id || !scriptDetails) return;
    
    try {
      setIsGenerating(true);
      
      const result = await parseScriptIntoScenes({
        scriptId: scriptId as Id<"scripts">,
        userId: user.id,
        videoId: scriptDetails.videoId,
      });
      
      toast.success("Script parsed into scenes");
    } catch (error) {
      console.error(error);
      toast.error("Error generating storyboard");
    } finally {
      setIsGenerating(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "intro":
        return <PlusCircle className="h-4 w-4" />;
      case "dialogue":
        return <MessageSquare className="h-4 w-4" />;
      case "transition":
        return <Workflow className="h-4 w-4" />;
      case "outro":
        return <ChevronRight className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "intro":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "dialogue":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "transition":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "outro":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Storyboard</h2>
        
        {scriptId && (
          <Button 
            size="sm" 
            onClick={generateStoryboard} 
            disabled={isGenerating || !isStoryboardEnabled || !scriptId || !scriptDetails}
            className="text-xs"
          >
            {isGenerating ? "Generating..." : "Generate Scenes"}
          </Button>
        )}
      </div>

      {!scriptId && (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <Layers className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Select a script from the list to generate a storyboard
          </p>
        </div>
      )}

      {scriptId && !scenes?.length && (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <Layers className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            No scenes generated yet. Parse your script to create scenes.
          </p>
          <Button 
            onClick={generateStoryboard} 
            disabled={isGenerating || !isStoryboardEnabled || !scriptDetails}
          >
            {isGenerating ? "Generating..." : "Generate Storyboard"}
          </Button>
        </div>
      )}

      {scenes && scenes.length > 0 && (
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
          {scenes.map((scene) => (
            <div
              key={scene._id}
              onClick={() => onSelectScene(scene._id)}
              className={`p-3 rounded-md border cursor-pointer transition-all ${
                selectedSceneId === scene._id
                  ? "border-primary bg-primary/5 dark:bg-primary/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 p-2 rounded-md ${getContentTypeColor(scene.contentType)}`}>
                  {getContentTypeIcon(scene.contentType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {scene.sceneName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {scene.sceneIndex + 1}
                    </span>
                  </div>
                  
                  {/* Content preview */}
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                    {scene.sceneContent}
                  </p>
                  
                  {/* Metadata */}
                  {scene.emotion && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Mood: {scene.emotion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Show image thumbnail if available */}
              {scene.imageId && (
                <div className="mt-2 h-16 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  {/* Image would be displayed here */}
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                    Image available
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StoryboardScenes; 