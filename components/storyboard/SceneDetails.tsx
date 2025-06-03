"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FeatureFlag } from "@/features/flags";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { ImageIcon, Camera, Pencil, RefreshCw, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sceneImageGeneration } from "@/actions/sceneImageGeneration";

const formSchema = z.object({
  sceneName: z.string().min(1, { message: "Name is required" }),
  sceneContent: z.string().min(1, { message: "Content is required" }),
  contentType: z.enum([
    "intro",
    "action",
    "dialogue",
    "transition",
    "outro",
    "other",
  ]),
  emotion: z.string().optional(),
  notes: z.string().optional(),
});

interface SceneDetailsProps {
  sceneId: string | null;
  scriptId: string | null;
  videoId: string;
}

// Define a type for our scene data but not use it directly in the component
type Scene = {
  _id: Id<"storyboard_scenes">;
  scriptId: Id<"scripts">;
  userId: string;
  videoId: string;
  sceneIndex: number;
  sceneContent: string;
  sceneName: string;
  contentType:
    | "intro"
    | "action"
    | "dialogue"
    | "transition"
    | "outro"
    | "other";
  emotion?: string;
  visualElements?: string[];
  imageId?: Id<"_storage">;
  voiceoverId?: Id<"voiceovers">;
  duration?: number;
  notes?: string;
  createdAt: number;
};

function SceneDetails({ sceneId, scriptId, videoId }: SceneDetailsProps) {
  const { user } = useUser();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedReferenceScene, setSelectedReferenceScene] =
    useState<string>("auto");

  // Use the SCENE_IMAGE_GENERATION feature flag
  const { value: isSceneImageGenerationEnabled } = useSchematicEntitlement(
    FeatureFlag.SCENE_IMAGE_GENERATION
  );

  // Use the proper API references
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
  // Get scenes with images for reference (scenes before current scene)
  const scenesWithImages =
    scenes
      ?.filter((s) => s.imageId && s.sceneIndex < (scene?.sceneIndex ?? 0))
      .sort((a, b) => b.sceneIndex - a.sceneIndex) || []; // Sort by index descending (most recent first)

  // Get the most recent scene with image for auto-selection
  const mostRecentSceneWithImage = scenesWithImages[0];

  // Get image URL if scene has an imageId
  useEffect(() => {
    if (scene?.imageId && user?.id) {
      const getImageUrl = async () => {
        try {
          const url = await fetch(
            `/api/get-image-url?storageId=${scene.imageId}&userId=${user.id}`
          );
          const data = await url.json();
          if (data.url) {
            setImageUrl(data.url);
          }
        } catch (error) {
          console.error("Error fetching image URL:", error);
        }
      };

      getImageUrl();
    } else {
      setImageUrl(null);
    }
  }, [scene?.imageId, user?.id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sceneName: scene?.sceneName || "",
      sceneContent: scene?.sceneContent || "",
      contentType:
        (scene?.contentType as
          | "intro"
          | "action"
          | "dialogue"
          | "transition"
          | "outro"
          | "other") || "action",
      emotion: scene?.emotion || "",
      notes: scene?.notes || "",
    },
  });

  // Update form values when scene changes
  useEffect(() => {
    if (scene) {
      form.reset({
        sceneName: scene.sceneName,
        sceneContent: scene.sceneContent,
        contentType: scene.contentType,
        emotion: scene.emotion || "",
        notes: scene.notes || "",
      });
    }
  }, [scene, form]);

  // Use the proper API references
  const updateScene = useMutation(api.storyboard.updateScene);

  const handleGenerateImage = async () => {
    if (!sceneId || !user?.id || !scene) return;

    try {
      setIsGeneratingImage(true);

      // Determine which reference scene to use
      let referenceSceneId: string | undefined;
      if (selectedReferenceScene === "auto") {
        referenceSceneId = mostRecentSceneWithImage?._id;
      } else if (selectedReferenceScene !== "none") {
        referenceSceneId = selectedReferenceScene;
      }

      // Show appropriate toast message
      if (referenceSceneId) {
        const refScene = scenes?.find((s) => s._id === referenceSceneId);
        toast.info(
          `Generating image using Scene ${(refScene?.sceneIndex ?? 0) + 1} as reference`,
          {
            description: "This may take a few moments...",
            duration: 3000,
          }
        );
      } else {
        toast.info("Image generation started", {
          description: "This may take a few moments...",
          duration: 3000,
        });
      }

      const result = await sceneImageGeneration(
        sceneId as string,
        scene.sceneContent,
        scene.emotion,
        scene.visualElements,
        videoId,
        referenceSceneId, // Pass the reference scene ID
        scriptId as string // Pass the script ID for easier queries
      );

      if (result.success) {
        toast.success("Image generated successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error generating image", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!sceneId) return;

    try {
      await updateScene({
        sceneId: sceneId as Id<"storyboard_scenes">,
        sceneName: data.sceneName,
        sceneContent: data.sceneContent,
        contentType: data.contentType,
        emotion: data.emotion || undefined,
        notes: data.notes || undefined,
      });

      toast.success("Scene updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update scene");
    }
  };

  if (!scene) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Select a scene to view and edit details
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Scene Details
        </h2>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>

          <Button
            size="sm"
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !isSceneImageGenerationEnabled}
          >
            {isGeneratingImage ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-1" />
            )}
            Generate Image
          </Button>
        </div>
      </div>

      {scenesWithImages.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Link className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reference Image for Consistency
            </span>
          </div>
          <Select
            value={selectedReferenceScene}
            onValueChange={setSelectedReferenceScene}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                Auto (Scene {(mostRecentSceneWithImage?.sceneIndex ?? 0) + 1} -
                Most Recent)
              </SelectItem>
              <SelectItem value="none">No Reference</SelectItem>
              {scenesWithImages.map((refScene) => (
                <SelectItem key={refScene._id} value={refScene._id}>
                  Scene {refScene.sceneIndex + 1}: {refScene.sceneName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Using a reference image helps maintain character and style
            consistency across scenes
          </p>
        </div>
      )}

      {/* Scene Content View */}
      <div className="space-y-4">
        {/* Image */}
        <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full max-w-full max-h-full">
                <Image
                  src={imageUrl}
                  alt={scene.sceneName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          ) : scene.imageId ? (
            <div className="text-center p-4">
              <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-2 animate-spin" />
              <p className="text-sm text-gray-500">Loading image...</p>
            </div>
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No image generated yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click &quot;Generate Image&quot; to create one
              </p>
            </div>
          )}
        </div>

        {/* Scene Info */}
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {scene.sceneName}
            </h3>
            <div className="mt-1 flex items-center">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  scene.contentType === "intro"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : scene.contentType === "dialogue"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : scene.contentType === "transition"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : scene.contentType === "outro"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {scene.contentType.charAt(0).toUpperCase() +
                  scene.contentType.slice(1)}
              </span>

              {scene.emotion && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Mood: {scene.emotion}
                </span>
              )}

              <span className="ml-auto text-xs text-gray-500">
                Scene {scene.sceneIndex + 1}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {scene.sceneContent}
          </div>

          {scene.notes && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                Notes
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                {scene.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Scene Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Scene</DialogTitle>
            <DialogDescription>
              Update the details for this scene
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="sceneName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scene Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Scene name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sceneContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scene Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Scene content"
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="intro">Intro</SelectItem>
                          <SelectItem value="action">Action</SelectItem>
                          <SelectItem value="dialogue">Dialogue</SelectItem>
                          <SelectItem value="transition">Transition</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emotion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emotion/Mood</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Happy, Serious" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Production notes"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SceneDetails;
