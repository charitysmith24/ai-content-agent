"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";

const IMAGE_SIZE = "1024x1024" as const;
const convexClient = getConvexClient();

/**
 * Generate a thumbnail image using OpenAI's gpt-image-1.5 model.
 * Gated by the IMAGE_GENERATION feature flag (separate from scene image generation).
 */
export const dalleImageGeneration = async (prompt: string, videoId: string) => {
  const user = await currentUser();

  if (!user?.id) {
    console.error("❌ Authentication error: User not found");
    throw new Error("User not found");
  }

  try {
    const schematicCtx = {
      company: { id: user.id },
      user: {
        id: user.id,
      },
    };

    const isImageGenerationEnabled = await client.checkFlag(
      schematicCtx,
      FeatureFlag.IMAGE_GENERATION
    );

    if (!isImageGenerationEnabled) {
      console.warn("⚠️ Image generation not enabled for user", user.id);
      throw new Error("Image generation is not enabled, please upgrade");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!prompt) {
      throw new Error("Failed to generate image prompt");
    }

    console.log("🎨 Generating image with gpt-image-1.5 model:", prompt);

    const imageResponse = await openai.images.generate({
      model: "gpt-image-1.5",
      prompt: prompt,
      size: IMAGE_SIZE,
      quality: "high",
    });

    if (!imageResponse.data || imageResponse.data.length === 0) {
      throw new Error("No image data received from OpenAI");
    }

    const imageData = imageResponse.data[0];

    if (!imageData.b64_json) {
      throw new Error("Expected base64 image data but received different format");
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

    // Step 3: Save the newly allocated storage id to the database
    console.log("💾 Saving image reference to database...");
    await convexClient.mutation(api.images.storeImage, {
      storageId: storageId,
      videoId,
      userId: user.id,
    });
    console.log("✅ Saved image reference to database");

    // Get serve image url
    const dbImageUrl = await convexClient.query(api.images.getImage, {
      videoId,
      userId: user.id,
    });

    // Track the image generation event
    await client.track({
      event: featureFlagEvents[FeatureFlag.IMAGE_GENERATION].event,
      company: {
        id: user.id,
      },
      user: {
        id: user.id,
      },
    });

    return {
      imageUrl: dbImageUrl,
    };
  } catch (error) {
    console.error("❌ Error in gpt-image-1.5 generation process:", {
      videoId,
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
