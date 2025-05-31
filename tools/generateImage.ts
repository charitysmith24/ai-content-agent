import { dalleImageGeneration } from "@/actions/dalleImageGeneration";
import { FeatureFlag } from "@/features/flags";
import { client } from "@/lib/schematic";
import { tool } from "ai";
import { z } from "zod";

export const generateImage = (videoId: string, userId: string) =>
  tool({
    description: "Generate an image",
    parameters: z.object({
      prompt: z.string().describe("The prompt to generate an image for"),
      videoId: z.string().describe("The YouTube video ID"),
    }),
    execute: async ({ prompt }) => {
      console.log("🔧 GenerateImage tool starting with:", { prompt, videoId, userId });
      
      try {
        const schematicCtx = {
          company: { id: userId },
          user: {
            id: userId,
          },
        };

        console.log("🔧 Checking feature flag...");
        const isImageGenerationEnabled = await client.checkFlag(
          schematicCtx,
          FeatureFlag.IMAGE_GENERATION
        );

        if (!isImageGenerationEnabled) {
          console.log("🔧 Feature flag disabled, returning error");
          return {
            error: "Image generation is not enabled, the user must upgrade",
          };
        }

        console.log("🔧 Calling dalleImageGeneration...");
        const image = await dalleImageGeneration(prompt, videoId);
        console.log("🔧 dalleImageGeneration completed successfully:", image);
        return { image };
      } catch (error) {
        console.error("❌ Error in generateImage tool:", error);
        console.error("❌ Error stack:", error instanceof Error ? error.stack : undefined);
        return {
          error: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        };
      }
    },
  });
