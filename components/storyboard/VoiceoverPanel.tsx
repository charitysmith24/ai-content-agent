"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FeatureFlag } from "@/features/flags";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { MicIcon, Play, Pause, Trash2, Volume2, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface VoiceoverPanelProps {
  sceneId: string | null;
  scriptId: string | null;
  videoId: string;
}

// Define types for our data
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

interface Voiceover {
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
  createdAt: number;
}

const MOCK_VOICES = [
  { id: "adam", name: "Adam (Male)", gender: "male" },
  { id: "sarah", name: "Sarah (Female)", gender: "female" },
  { id: "thomas", name: "Thomas (Male)", gender: "male" },
  { id: "emily", name: "Emily (Female)", gender: "female" },
  { id: "michael", name: "Michael (Male)", gender: "male" },
];

function VoiceoverPanel({ sceneId, scriptId, videoId }: VoiceoverPanelProps) {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(MOCK_VOICES[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { value: isVoiceoverEnabled } = useSchematicEntitlement(
    FeatureFlag.VOICEOVER_GENERATION
  );
  
  // Get scene details if a scene is selected
  const scenes = useQuery(
    api.storyboard.getScenes,
    sceneId && scriptId ? {
      scriptId: scriptId as Id<"scripts">,
      userId: user?.id ?? ""
    } : "skip"
  );
  
  const scene = scenes?.find(s => s._id === sceneId);
  
  // Get voiceover if it exists for this scene
  const voiceover = useQuery(
    api.voiceover.getSceneVoiceover,
    sceneId ? {
      sceneId: sceneId as Id<"storyboard_scenes">,
      userId: user?.id ?? ""
    } : "skip"
  );
  
  // Mutations
  const generateVoiceover = useMutation(api.voiceover.generateVoiceover);
  const deleteVoiceover = useMutation(api.voiceover.deleteVoiceover);
  
  const handleGenerateVoiceover = async () => {
    if (!sceneId || !scriptId || !user?.id || !scene) return;
    
    try {
      setIsGenerating(true);
      await generateVoiceover({
        scriptId: scriptId as Id<"scripts">,
        sceneId: sceneId as Id<"storyboard_scenes">,
        userId: user.id,
        videoId,
        text: scene.sceneContent,
        voiceName: selectedVoice,
      });
      toast.success("Voice-over generation started");
    } catch (error) {
      console.error(error);
      toast.error("Error generating voice-over");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDeleteVoiceover = async () => {
    if (!voiceover) return;
    
    try {
      await deleteVoiceover({
        voiceoverId: voiceover._id,
      });
      toast.success("Voice-over deleted");
    } catch (error) {
      console.error(error);
      toast.error("Error deleting voice-over");
    }
  };
  
  const togglePlayback = () => {
    // In a real implementation, this would control the audio playback
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      toast.info("Playing voice-over", {
        description: "This is a mock implementation. In production, this would play the actual audio.",
        duration: 3000,
      });
    }
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Voice-Over</h2>
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
            <Label htmlFor="voice-select" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Select Voice</Label>
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
              disabled={!!voiceover || isGenerating}
            >
              <SelectTrigger id="voice-select" className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button or Audio Player */}
          {!voiceover ? (
            <Button 
              onClick={handleGenerateVoiceover}
              disabled={isGenerating || !scene}
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
              {/* Audio Player UI */}
              <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {voiceover.voiceName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {voiceover.duration ? `${voiceover.duration}s` : "Processing..."}
                  </span>
                </div>
                
                {/* Audio Controls */}
                <div className="flex items-center gap-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  {/* Mock progress bar */}
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full" 
                      style={{ width: isPlaying ? "45%" : "0%" }}
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
              </div>
              
              {/* Regenerate Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleGenerateVoiceover}
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate with {MOCK_VOICES.find(v => v.id === selectedVoice)?.name}
              </Button>
            </div>
          )}
          
          {/* Text Preview */}
          {scene && (
            <div className="mt-4">
              <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Voice-Over Text:</Label>
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