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
import { ImageIcon, Camera, Pencil, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const formSchema = z.object({
  sceneName: z.string().min(1, { message: "Name is required" }),
  sceneContent: z.string().min(1, { message: "Content is required" }),
  contentType: z.enum(["intro", "action", "dialogue", "transition", "outro", "other"]),
  emotion: z.string().optional(),
  notes: z.string().optional(),
});

interface SceneDetailsProps {
  sceneId: string | null;
  scriptId: string | null;
  videoId: string;
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
  contentType: "intro" | "action" | "dialogue" | "transition" | "outro" | "other";
  emotion?: string;
  visualElements?: string[];
  imageId?: Id<"_storage">;
  voiceoverId?: Id<"voiceovers">;
  duration?: number;
  notes?: string;
  createdAt: number;
}

function SceneDetails({ sceneId, scriptId, videoId }: SceneDetailsProps) {
  const { user } = useUser();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { value: isSceneImageGenerationEnabled } = useSchematicEntitlement(
    FeatureFlag.SCENE_IMAGE_GENERATION
  );
  
  // Use the proper API references
  const scenes = useQuery(
    api.storyboard.getScenes,
    sceneId && scriptId ? {
      scriptId: scriptId as Id<"scripts">,
      userId: user?.id ?? ""
    } : "skip"
  );
  
  const scene = scenes?.find(s => s._id === sceneId);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sceneName: scene?.sceneName || "",
      sceneContent: scene?.sceneContent || "",
      contentType: (scene?.contentType as any) || "action",
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
  const generateSceneImage = useMutation(api.storyboard.generateSceneImage);
  
  const handleGenerateImage = async () => {
    if (!sceneId || !user?.id) return;
    
    try {
      setIsGeneratingImage(true);
      await generateSceneImage({
        sceneId: sceneId as Id<"storyboard_scenes">,
        userId: user.id,
      });
      toast.success("Image generation started");
    } catch (error) {
      console.error(error);
      toast.error("Error generating image");
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scene Details</h2>
        
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

      {/* Scene Content View */}
      <div className="space-y-4">
        {/* Image */}
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
          {scene.imageId ? (
            <div className="relative w-full h-full">
              {/* In a real implementation, we would fetch the image URL from storage */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Scene image would display here
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No image generated yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Generate Image" to create one</p>
            </div>
          )}
        </div>
        
        {/* Scene Info */}
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-1">
            {scene.sceneName}
          </h3>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              {scene.contentType}
            </span>
            
            {scene.emotion && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                Mood: {scene.emotion}
              </span>
            )}
            
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Scene {scene.sceneIndex + 1}
            </span>
          </div>
          
          {/* Content */}
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {scene.sceneContent}
          </p>
          
          {/* Notes */}
          {scene.notes && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-100 dark:border-amber-800">
              <h4 className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Production Notes</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">{scene.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Scene</DialogTitle>
            <DialogDescription>
              Update the details of this scene in your storyboard.
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
                      <Input placeholder="Enter scene name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                          <SelectValue placeholder="Select content type" />
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
                    <FormLabel>Emotion/Mood (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., happy, serious, dramatic" {...field} />
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
                        placeholder="Enter scene content/script" 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any production notes or instructions" 
                        className="min-h-[80px]"
                        {...field} 
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