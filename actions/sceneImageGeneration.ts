"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { Id } from "@/convex/_generated/dataModel";

// Using GPT-Image-1 for storyboard scene image generation
// This model is preferred for detailed scene images with precise control over visual elements
const IMAGE_SIZE = "1536x1024" as const; // Supported: "1024x1024", "1024x1536", "1536x1024", or "auto"
const convexClient = getConvexClient();

/**
 * Generate a detailed scene image using OpenAI's GPT-Image-1 model
 *
 * This action is specifically for generating storyboard scene images and is gated by
 * the SCENE_IMAGE_GENERATION feature flag (different from thumbnail generation).
 *
 * The scene images include more context like emotional tone and visual elements
 * to create a more accurate representation of the scene.
 */
export const sceneImageGeneration = async (
  sceneId: string,
  sceneContent: string,
  emotion: string | undefined,
  visualElements: string[] | undefined,
  videoId: string
) => {
  const user = await currentUser();

  if (!user?.id) {
    console.error("❌ Authentication error: User not found");
    throw new Error("User not found");
  }

  try {
    // Check feature flag
    const schematicCtx = {
      company: { id: user.id },
      user: {
        id: user.id,
      },
    };

    // Check the SCENE_IMAGE_GENERATION feature flag
    const isSceneImageGenerationEnabled = await client.checkFlag(
      schematicCtx,
      FeatureFlag.SCENE_IMAGE_GENERATION
    );

    if (!isSceneImageGenerationEnabled) {
      console.warn("⚠️ Scene image generation not enabled for user", user.id);
      throw new Error("Scene image generation is not enabled, please upgrade");
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Construct a more detailed prompt for scene visualization
    let detailedPrompt = `Create a vivid, cinematic image for the following scene from a video storyboard:\n\n${sceneContent}`;

    if (emotion) {
      detailedPrompt += `\n\nThe emotional tone should be: ${emotion}`;
    }

    if (visualElements && visualElements.length > 0) {
      detailedPrompt += `\n\nImportant visual elements to include: ${visualElements.join(", ")}`;
    }

    detailedPrompt +=
      "\n\nCreate a high-quality, professional image suitable for a video production storyboard. Use realistic style with good lighting and composition.";

    console.log("🎨 Generating scene image with prompt:", detailedPrompt);

    // Generate the image using GPT-Image-1 with streaming
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: detailedPrompt,
      size: IMAGE_SIZE,
      quality: "high", // "low", "medium", "high", or "auto"
    });

    // Fix the linter error by checking if data exists
    if (!imageResponse.data || imageResponse.data.length === 0) {
      throw new Error("No image data received from OpenAI");
    }

    // Handle base64 response (default for gpt-image-1)
    const imageData = imageResponse.data[0];

    if (!imageData.b64_json) {
      throw new Error(
        "Expected base64 image data but received different format"
      );
    }

    console.log("📥 Processing base64 image data...");
    const imageBytes = Buffer.from(imageData.b64_json, "base64");
    const imageBlob = new Blob([imageBytes], { type: "image/png" });

    // Step 1: Get a short-lived upload URL for Convex
    console.log("📤 Getting upload URL...");
    const postUrl = await convexClient.mutation(api.images.generateUploadUrl);
    console.log("✅ Got upload URL");

    // Step 2: Upload the image to the convex storage bucket
    console.log("📁 Uploading image to storage...");
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": imageBlob.type },
      body: imageBlob,
    });

    if (!result.ok) {
      throw new Error("Failed to upload image to storage");
    }

    const { storageId } = await result.json();
    console.log("✅ Uploaded image to storage with ID:", storageId);

    // Step 3: Update the scene with the storage ID
    console.log("💾 Updating scene with image reference...");
    await convexClient.mutation(api.storyboard.updateSceneImage, {
      sceneId: sceneId as Id<"storyboard_scenes">,
      imageId: storageId,
      userId: user.id,
    });
    console.log("✅ Updated scene with image reference");

    // Track the scene image generation event
    await client.track({
      event: featureFlagEvents[FeatureFlag.SCENE_IMAGE_GENERATION].event,
      company: {
        id: user.id,
      },
      user: {
        id: user.id,
      },
    });

    return {
      success: true,
      storageId,
    };
  } catch (error) {
    console.error("❌ Error in scene image generation process:", {
      sceneId,
      videoId,
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
