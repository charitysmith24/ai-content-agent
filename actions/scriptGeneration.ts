"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";

const convexClient = getConvexClient();

export async function scriptGeneration(
  videoId: string,
  videoSummary: string,
  transcript: string,
  considerations: string,
  existingTitle?: string | null,
  originalVideoTitle?: string
) {
  console.log("[scriptGeneration] Called with", {
    videoId,
    videoSummaryLength: videoSummary?.length,
    transcriptLength: transcript?.length,
    considerations,
    existingTitle,
    originalVideoTitle,
  });

  try {
    // Get current user
    console.log("[scriptGeneration] Getting current user");
    const user = await currentUser();

    if (!user?.id) {
      console.error("[scriptGeneration] User not found");
      throw new Error("User not found");
    }
    console.log("[scriptGeneration] User authenticated:", user.id);

    // Initialize OpenAI
    console.log("[scriptGeneration] Initializing OpenAI client");
    if (!process.env.OPENAI_API_KEY) {
      console.error("[scriptGeneration] OpenAI API key not found");
      throw new Error("OpenAI API key not configured");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare context and parameters
    console.log("[scriptGeneration] Preparing context for script generation");
    // Determine title information for context
    const titleContext = existingTitle || originalVideoTitle || "Video Content";
    const titleSource = existingTitle
      ? "ai_generated"
      : originalVideoTitle
        ? "original_video"
        : "auto_generated";

    // Enhanced system prompt with title context
    const systemPrompt = `You are a professional YouTube script writer that creates engaging, step-by-step shooting scripts. Your scripts should be detailed, actionable, and formatted for easy production. Include scene descriptions, dialogue suggestions, B-roll suggestions, and filming notes.

    ${existingTitle ? `IMPORTANT: This video has a generated title: "${existingTitle}". Ensure your script aligns with and supports this title's messaging and promise.` : ""}

    ${originalVideoTitle ? `VIDEO CONTEXT: Original video title - "${originalVideoTitle}"` : ""}`;

    // Generate script with OpenAI
    console.log("[scriptGeneration] Calling OpenAI API");
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Please create a comprehensive step-by-step shooting script for a YouTube video based on this content. The script should include:

            1. Hook/Opening (first 15 seconds)
            2. Introduction
            3. Main content sections with clear transitions
            4. Call-to-action
            5. Outro

            Include specific filming notes, B-roll suggestions, and dialogue recommendations.

            ${titleContext !== "Video Content" ? `Video Title: ${titleContext}` : ""}

            Video Summary: ${videoSummary}

            Video Transcript: ${transcript}

            Additional Considerations: ${considerations}

            Format the script in a clear, production-ready format with scene numbers and timing suggestions.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      console.log("[scriptGeneration] OpenAI API response received");
    } catch (openaiError) {
      console.error("[scriptGeneration] OpenAI API error:", openaiError);
      throw new Error(`OpenAI API error: ${(openaiError as Error).message}`);
    }

    const script =
      response.choices[0]?.message?.content || "Unable to generate script";

    if (!script) {
      console.error("[scriptGeneration] Empty script returned from OpenAI");
      return {
        error: "Failed to generate script (System error)",
      };
    }
    console.log("[scriptGeneration] Script generated, length:", script.length);

    // Generate a descriptive script title
    const generateScriptTitle = (title: string) => {
      const maxLength = 60;
      const prefix = "Script: ";
      const availableLength = maxLength - prefix.length;

      if (title.length <= availableLength) {
        return `${prefix}${title}`;
      }
      return `${prefix}${title.substring(0, availableLength - 3)}...`;
    };

    const scriptTitle = generateScriptTitle(titleContext);
    console.log("[scriptGeneration] Created script title:", scriptTitle);

    // Determine script type based on content analysis
    const determineScriptType = (summary: string, title: string) => {
      const content = `${summary} ${title}`.toLowerCase();

      if (
        content.includes("tutorial") ||
        content.includes("how to") ||
        content.includes("guide")
      ) {
        return "tutorial" as const;
      }
      if (
        content.includes("marketing") ||
        content.includes("brand") ||
        content.includes("promotion")
      ) {
        return "marketing" as const;
      }
      if (
        content.includes("entertainment") ||
        content.includes("funny") ||
        content.includes("comedy")
      ) {
        return "entertainment" as const;
      }
      if (
        content.includes("education") ||
        content.includes("learn") ||
        content.includes("explain")
      ) {
        return "educational" as const;
      }
      return "general" as const;
    };

    const scriptType = determineScriptType(videoSummary, titleContext);
    console.log("[scriptGeneration] Determined script type:", scriptType);

    // Save to Convex database
    console.log("[scriptGeneration] Saving script to Convex database");
    try {
      await convexClient.mutation(api.scripts.generate, {
        videoId,
        userId: user.id,
        script: script,
        scriptTitle,
        videoTitle: originalVideoTitle,
        generatedTitle: existingTitle || undefined,
        titleSource: titleSource as
          | "original_video"
          | "ai_generated"
          | "user_defined"
          | "auto_generated",
        scriptType,
      });
      console.log("[scriptGeneration] Script saved to database successfully");
    } catch (convexError) {
      console.error("[scriptGeneration] Error saving to Convex:", convexError);
      // Continue to track usage even if saving fails
    }

    // Track feature usage
    console.log("[scriptGeneration] Tracking feature usage with Schematic");
    try {
      // First, track the event for analytics
      await client.track({
        event: featureFlagEvents[FeatureFlag.SCRIPTS_GENERATION].event,
        company: {
          id: user.id,
        },
        user: {
          id: user.id,
        },
      });

      console.log("[scriptGeneration] Feature usage tracked successfully");
    } catch (trackError) {
      console.error(
        "[scriptGeneration] Error tracking feature usage:",
        trackError
      );
      // Continue anyway - tracking failure shouldn't prevent script return
    }

    // Also track in Convex for internal analytics
    try {
      await convexClient.mutation(api.userAnalytics.trackUserActivity, {
        userId: user.id,
        activity: {
          scriptsGenerated: 1,
          scriptGeneration: 1,
        },
      });
      console.log("[scriptGeneration] Activity tracked in Convex");
    } catch (convexError) {
      console.error(
        "[scriptGeneration] Error tracking in Convex:",
        convexError
      );
      // Continue anyway - tracking failure shouldn't prevent script return
    }

    console.log("[scriptGeneration] Script generation completed successfully");
    return script;
  } catch (error) {
    console.error("[scriptGeneration] ❌ Error generating script:", error);
    throw new Error(`Failed to generate script: ${(error as Error).message}`);
  }
}
