"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, useAction } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FeatureFlag } from "@/features/flags";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import {
  MicIcon,
  Play,
  Pause,
  Trash2,
  Volume2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAudioPlayer } from "@/components/hooks/useAudioPlayer";
import AudioErrorBoundary from "@/components/errors/AudioErrorBoundary";

interface VoiceoverPanelProps {
  sceneId: string | null;
  scriptId: string | null;
  videoId: string;
}

// Define type for Scene but don't use it directly
type Scene = {
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
};

// Define type for Voiceover but don't use it directly
type Voiceover = {
  _id: Id<"voiceovers">;
  scriptId: Id<"scripts">;
  sceneId?: Id<"storyboard_scenes">;
  userId: string;
  videoId: string;
  storageId: Id<"_storage">;
  voiceName: string;
  voiceProvider: string;
  duration?: number;
  text: string;
  status?: "processing" | "completed" | "failed";
  errorMessage?: string;
  url?: string;
  createdAt: number;
};

// Type for ElevenLabs voice
type ElevenLabsVoice = {
  id: string;
  name: string;
  gender: string;
  category: string;
};

function VoiceoverPanel({ sceneId, scriptId, videoId }: VoiceoverPanelProps) {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  const { value: isVoiceoverEnabled } = useSchematicEntitlement(
    FeatureFlag.VOICEOVER_GENERATION
  );

  // Get scene details if a scene is selected
  const scenes = useQuery(
    api.storyboard.getScenes,
    sceneId && scriptId
      ? {
          scriptId: scriptId as Id<"scripts">,
          userId: user?.id ?? "",
        }
      : "skip"
  );

  const scene = scenes?.find((s) => s._id === sceneId);

  // Get voiceover if it exists for this scene
  const voiceover = useQuery(
    api.voiceover.getSceneVoiceover,
    sceneId
      ? {
          sceneId: sceneId as Id<"storyboard_scenes">,
          userId: user?.id ?? "",
        }
      : "skip"
  );

  // Get available voices from ElevenLabs
  const voicesAction = useAction(api.voiceover.getAvailableVoices);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);

  // Use the custom audio player hook
  const {
    isPlaying,
    progress,
    error: audioError,
    audioRef,
    togglePlayback,
    resetError,
  } = useAudioPlayer(
    // Only pass a valid URL string or undefined
    voiceover?.url && typeof voiceover.url === "string"
      ? voiceover.url
      : undefined,
    () => {
      // No special handling needed for onEnded
    }
  );

  // Fetch voices when component mounts
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const fetchedVoices = await voicesAction({});
        if (fetchedVoices && Array.isArray(fetchedVoices)) {
          setVoices(fetchedVoices);
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
      }
    };

    fetchVoices();
  }, [voicesAction]);

  // Set the first voice as selected by default when voices are loaded
  useEffect(() => {
    if (voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0].id);
    }
  }, [voices, selectedVoice]);

  // Mutations
  const generateVoiceover = useMutation(api.voiceover.generateVoiceover);
  const deleteVoiceover = useMutation(api.voiceover.deleteVoiceover);

  const handleGenerateVoiceover = async () => {
    if (!sceneId || !scriptId || !user?.id || !scene || !selectedVoice) return;

    try {
      setIsGenerating(true);

      const result = await generateVoiceover({
        scriptId: scriptId as Id<"scripts">,
        sceneId: sceneId as Id<"storyboard_scenes">,
        userId: user.id,
        videoId,
        text: scene.sceneContent,
        voiceName: selectedVoice,
      });

      if (result.success) {
        toast.success("Voice-over generation started");
      } else {
        throw new Error("Failed to start voice-over generation");
      }
    } catch (error) {
      console.error("Error generating voice-over:", error);

      // Get a user-friendly error message
      let errorMessage = "Error generating voice-over";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      // Show a more specific error message
      toast.error(errorMessage, {
        description: "Please try again or select a different voice",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteVoiceover = async () => {
    if (!voiceover) return;

    try {
      // Stop audio if playing
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }

      await deleteVoiceover({
        voiceoverId: voiceover._id,
      });

      toast.success("Voice-over deleted");
    } catch (error) {
      console.error(error);
      toast.error("Error deleting voice-over");
    }
  };

  // Helper function to get voice name from ID
  const getVoiceName = (voiceId: string) => {
    if (!voices.length) return voiceId;
    const voice = voices.find((v) => v.id === voiceId);
    return voice ? voice.name : voiceId;
  };

  if (!scriptId || !sceneId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <Volume2 className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Select a scene to manage voice-overs
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Voice-Over
        </h2>
      </div>

      {!isVoiceoverEnabled && (
        <div className="text-center py-6 px-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-amber-700 dark:text-amber-300 font-medium">
            Voice-Over Generation Disabled
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Upgrade your plan to generate voice-overs
          </p>
        </div>
      )}

      {isVoiceoverEnabled && (
        <>
          {/* Voice Selection */}
          <div className="mb-4">
            <Label
              htmlFor="voice-select"
              className="text-xs text-gray-500 dark:text-gray-400 mb-1 block"
            >
              Select Voice
            </Label>
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
              disabled={voiceover?.status === "processing" || isGenerating}
            >
              <SelectTrigger id="voice-select" className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.length > 0 ? (
                  voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Loading voices...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button or Audio Player */}
          {!voiceover ? (
            <Button
              onClick={handleGenerateVoiceover}
              disabled={isGenerating || !scene || !selectedVoice}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MicIcon className="h-4 w-4 mr-2" />
                  Generate Voice-Over
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Processing Status */}
              {voiceover.status === "processing" && (
                <div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-sm font-medium">
                      Processing voice-over...
                    </span>
                  </div>
                </div>
              )}
              {/* Error Status */}
              {voiceover.status === "failed" && (
                <div className="border rounded-md p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Voice-over generation failed
                    </span>
                  </div>
                  {voiceover.errorMessage && (
                    <p className="text-xs mt-1">{voiceover.errorMessage}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleGenerateVoiceover}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
              {/* Completed Status with Audio Player */}
              {voiceover.status === "completed" && (
                <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getVoiceName(voiceover.voiceName)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {voiceover.duration
                        ? `${voiceover.duration}s`
                        : "Processing..."}
                    </span>
                  </div>

                  {/* Audio Controls with Error Boundary */}
                  <AudioErrorBoundary onReset={resetError}>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={togglePlayback}
                        disabled={
                          !voiceover.url ||
                          typeof voiceover.url !== "string" ||
                          audioError !== null
                        }
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Real progress bar */}
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={handleDeleteVoiceover}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AudioErrorBoundary>

                  {/* Display audio error outside of error boundary if it exists */}
                  {audioError && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Error playing audio. Please try again or regenerate the
                      voice-over.
                    </div>
                  )}
                </div>
              )}
              {/* Regenerate Button */}
              {voiceover.status === "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleGenerateVoiceover}
                  disabled={isGenerating}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
                  />
                  Regenerate with {getVoiceName(selectedVoice)}
                </Button>
              )}
            </div>
          )}

          {/* Text Preview */}
          {scene && (
            <div className="mt-4">
              <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                Voice-Over Text:
              </Label>
              <div className="text-xs text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800/30 border rounded-md max-h-[100px] overflow-y-auto">
                {scene.sceneContent}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VoiceoverPanel;
