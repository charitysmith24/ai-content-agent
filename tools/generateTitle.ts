import { titleGeneration } from "@/actions/titleGeneration";
import { FeatureFlag } from "@/features/flags";
import { client } from "@/lib/schematic";
import { tool } from "ai";
import { z } from "zod";

const generateTitle = (userId: string) =>
  tool({
    description: "Generate a title for a YouTube video",
    parameters: z.object({
      videoId: z.string().describe("The video ID to generate a title for"),
      videoSummary: z
        .string()
        .describe("The summary of the video to generate a title for"),
      considerations: z
        .string()
        .describe("Any additional considerations for the title"),
    }),
    execute: async ({ videoId, videoSummary, considerations }) => {
      try {
        const schematicCtx = {
          company: { id: userId },
          user: {
            id: userId,
          },
        };

        let isTitleGenerationEnabled: boolean;
        try {
          isTitleGenerationEnabled = await client.checkFlag(
            schematicCtx,
            FeatureFlag.TITLE_GENERATION
          );
        } catch (flagError) {
          console.error("[generateTitle] Error checking feature flag:", flagError);
          return { error: "Error checking feature access" };
        }

        if (!isTitleGenerationEnabled) {
          return {
            error: "Title generation is not enabled, the user must upgrade",
          };
        }

        let result;
        try {
          result = await titleGeneration(videoId, videoSummary, considerations);
        } catch (titleError) {
          console.error("[generateTitle] Error in titleGeneration action:", titleError);
          return { error: "Failed to generate title" };
        }

        return { title: result };
      } catch (err) {
        console.error("[generateTitle] Unexpected error:", err);
        return { error: "Internal error in title generation tool" };
      }
    },
  });

export default generateTitle;
