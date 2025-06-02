import { scriptGeneration } from "@/actions/scriptGeneration";
import { FeatureFlag } from "@/features/flags";
import { client } from "@/lib/schematic";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { tool } from "ai";
import { z } from "zod";

const generateScript = (userId: string) =>
  tool({
    description: "Generate a step-by-step shooting script for a YouTube video",
    parameters: z.object({
      videoId: z.string().describe("The video ID to generate a script for"),
      videoSummary: z
        .string()
        .describe("The summary of the video to generate a script for"),
      transcript: z
        .string()
        .describe("The transcript of the video"),
      considerations: z
        .string()
        .describe("Any additional considerations for the script"),
      originalVideoTitle: z
        .string()
        .optional()
        .describe("The original YouTube video title"),
    }),
    execute: async ({ videoId, videoSummary, transcript, considerations, originalVideoTitle }) => {
      try {
        console.log("[generateScript] Starting execution", { 
          userId, 
          videoId, 
          videoSummaryLength: videoSummary?.length,
          transcriptLength: transcript?.length,
          considerations, 
          originalVideoTitle 
        });

        // Validate inputs
        if (!videoId || !videoSummary || !transcript) {
          console.error("[generateScript] Missing required parameters", { 
            hasVideoId: !!videoId, 
            hasVideoSummary: !!videoSummary, 
            hasTranscript: !!transcript
          });
          return { error: "Missing required parameters" };
        }

        const schematicCtx = {
          company: { id: userId },
          user: {
            id: userId,
          },
        };

        // Check feature flag
        console.log("[generateScript] Checking feature flag");
        let isScriptGenerationEnabled;
        try {
          isScriptGenerationEnabled = await client.checkFlag(
            schematicCtx,
            FeatureFlag.SCRIPT_GENERATION
          );
          console.log("[generateScript] Feature flag check result:", isScriptGenerationEnabled);
        } catch (flagError) {
          console.error("[generateScript] Error checking feature flag:", flagError);
          return { error: "Error checking feature access" };
        }

        if (!isScriptGenerationEnabled) {
          console.warn("[generateScript] Script generation not enabled for user", userId);
          return {
            error: "Script generation is not enabled, the user must upgrade",
          };
        }

        // Check for existing generated title
        console.log("[generateScript] Fetching existing title");
        let existingTitle;
        try {
          const convexClient = getConvexClient();
          existingTitle = await convexClient.query(api.titles.getLatestTitle, {
            videoId,
            userId,
          });
          console.log("[generateScript] Existing title result:", existingTitle);
        } catch (convexError) {
          console.error("[generateScript] Error fetching existing title:", convexError);
          // Continue without title - non-critical error
        }

        // Generate script
        console.log("[generateScript] Calling scriptGeneration action");
        let script;
        try {
          script = await scriptGeneration(
            videoId,
            videoSummary,
            transcript,
            considerations,
            existingTitle,
            originalVideoTitle
          );
          console.log("[generateScript] Script generated successfully", typeof script === 'string' ? { length: script.length } : {});
        } catch (scriptError) {
          console.error("[generateScript] Error in scriptGeneration action:", scriptError);
          return { error: "Failed to generate script" };
        }

        return { script };
      } catch (err) {
        console.error("[generateScript] Unexpected error:", err);
        return { error: "Internal error in script generation tool" };
      }
    },
  });

export default generateScript; 