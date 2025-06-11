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
 * Convert image URL to base64 string for OpenAI API
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // Determine the image format from the response headers or URL
    const contentType = response.headers.get("content-type") || "image/png";
    const mimeType = contentType.includes("image/") ? contentType : "image/png";

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to process reference image");
  }
}

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
  videoId: string,
  referenceSceneId?: string, // New parameter for reference image
  scriptId?: string // Add scriptId to make queries easier
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

    // Handle reference image if provided
    let referenceImageBase64: string | undefined;
    let referenceSceneInfo = "";
    let referenceImageAnalysis = "";

    if (referenceSceneId && scriptId) {
      try {
        console.log(
          "🖼️ Fetching reference image from scene:",
          referenceSceneId
        );

        // Get all scenes for this script
        const allScenes = await convexClient.query(api.storyboard.getScenes, {
          scriptId: scriptId as Id<"scripts">,
          userId: user.id,
        });

        // Find the specific reference scene
        const refScene = allScenes?.find((s) => s._id === referenceSceneId);

        if (refScene?.imageId) {
          // Get the image URL from Convex storage
          const imageUrl = await convexClient.query(api.images.getStorageUrl, {
            storageId: refScene.imageId,
            userId: user.id,
          });

          if (imageUrl) {
            console.log("🔄 Converting reference image to base64...");
            referenceImageBase64 = await imageUrlToBase64(imageUrl);
            referenceSceneInfo = `Reference Scene ${refScene.sceneIndex + 1}: ${refScene.sceneName}`;

            // Use Vision API to analyze the reference image
            console.log("🔍 Analyzing reference image with Vision API...");
            const visionResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Analyze this storyboard image and describe the key visual elements for consistency: character appearance (facial features, hair, clothing), art style, lighting, color palette, and overall mood. Be specific and detailed for maintaining visual consistency in subsequent scenes.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: referenceImageBase64,
                      },
                    },
                  ],
                },
              ],
              max_tokens: 300,
            });

            referenceImageAnalysis =
              visionResponse.choices[0]?.message?.content || "";
            console.log("✅ Reference image analyzed successfully");
          }
        }
      } catch (error) {
        console.warn("⚠️ Failed to process reference image:", error);
        // Continue without reference image rather than failing completely
        referenceImageAnalysis = "";
      }
    }

    // Construct the prompt - enhanced based on whether we have a reference image analysis
    let detailedPrompt = "";

    if (referenceImageAnalysis) {
      detailedPrompt = `Create a new scene image that maintains VISUAL CONSISTENCY with this reference description:

          REFERENCE IMAGE ANALYSIS:
          ${referenceImageAnalysis}

          NEW SCENE DESCRIPTION:
          ${sceneContent}`;

      if (emotion) {
        detailedPrompt += `\n\nEMOTIONAL TONE: ${emotion}`;
      }

      if (visualElements && visualElements.length > 0) {
        detailedPrompt += `\n\nVISUAL ELEMENTS TO INCLUDE: ${visualElements.join(", ")}`;
      }

      detailedPrompt += `\n\nIMPORTANT: Maintain the same character appearance, art style, lighting, and color palette as described in the reference analysis while adapting to the new scene context above.`;

      console.log(
        "🎨 Generating scene image WITH reference analysis for consistency"
      );
    } else {
      // Original prompt structure for scenes without reference
      detailedPrompt = `Create a vivid, cinematic image for the following scene from a video storyboard:\n\n${sceneContent}`;

      if (emotion) {
        detailedPrompt += `\n\nThe emotional tone should be: ${emotion}`;
      }

      if (visualElements && visualElements.length > 0) {
        detailedPrompt += `\n\nImportant visual elements to include: ${visualElements.join(", ")}`;
      }

      detailedPrompt +=
        "\n\nCreate a high-quality, professional image suitable for a video production storyboard. Use realistic style with good lighting and composition.";

      console.log(
        "🎨 Generating scene image WITHOUT reference (first scene or no reference selected)"
      );
    }

    console.log("🎨 Using prompt:", detailedPrompt.substring(0, 200) + "...");
    if (referenceSceneInfo) {
      console.log("📎 Using reference from:", referenceSceneInfo);
    }

    // Generate the image using GPT-Image-1 (standard image generation, no reference image passed)
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: detailedPrompt,
      size: IMAGE_SIZE,
      moderation: "auto",
      output_compression: 75,
      output_format: "webp",
      quality: "auto",
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

    // Log success with reference info
    if (referenceImageAnalysis) {
      console.log(
        `✅ Scene image generated successfully WITH reference analysis from ${referenceSceneInfo}`
      );
    } else {
      console.log("✅ Scene image generated successfully WITHOUT reference");
    }

    return {
      success: true,
      storageId,
      usedReference: !!referenceImageAnalysis,
      referenceInfo: referenceSceneInfo || undefined,
    };
  } catch (error) {
    console.error("❌ Error in scene image generation process:", {
      sceneId,
      videoId,
      userId: user.id,
      referenceSceneId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
