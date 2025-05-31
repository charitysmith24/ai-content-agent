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
      const schematicCtx = {
        company: { id: userId },
        user: {
          id: userId,
        },
      };

      const isScriptGenerationEnabled = await client.checkFlag(
        schematicCtx,
        FeatureFlag.SCRIPT_GENERATION
      );

      if (!isScriptGenerationEnabled) {
        return {
          error: "Script generation is not enabled, the user must upgrade",
        };
      }

      // Check for existing generated title
      const convexClient = getConvexClient();
      const existingTitle = await convexClient.query(api.titles.getLatestTitle, {
        videoId,
        userId,
      });

      console.log("📝 Checking for existing title:", existingTitle);
      console.log("📝 Original video title:", originalVideoTitle);

      const script = await scriptGeneration(
        videoId,
        videoSummary,
        transcript,
        considerations,
        existingTitle,
        originalVideoTitle
      );
      return { script };
    },
  });

export default generateScript; 