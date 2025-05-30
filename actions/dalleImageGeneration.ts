"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";

// Updated image size options for gpt-image-1
const IMAGE_SIZE = "1024x1024" as const; // Supported: "1024x1024", "1024x1536", "1536x1024", or "auto"
const convexClient = getConvexClient();

export const dalleImageGeneration = async (prompt: string, videoId: string) => {
  const user = await currentUser();

  if (!user?.id) {
    console.error("❌ Authentication error: User not found");
    throw new Error("User not found");
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  
    if (!prompt) {
      throw new Error("Failed to generate image prompt");
    }
  
    console.log("🎨 Generating image with GPT-Image-1 model:", prompt);
  
    // Generate the image using GPT-Image-1 following official documentation
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
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
      throw new Error("Expected base64 image data but received different format");
    }

    console.log("📥 Processing base64 image data...");
    const imageBytes = Buffer.from(imageData.b64_json, 'base64');
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });
  
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
    console.error("❌ Error in GPT-Image-1 generation process:", {
      videoId,
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};