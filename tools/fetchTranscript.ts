import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";
import { tool } from "ai";
import { z } from "zod";

const fetchTranscript = tool({
  description: "Fetch the transcript of a video",
  parameters: z.object({
    videoId: z
      .string()
      .describe("The ID of the video to fetch the transcript for"),
  }),
  execute: async ({ videoId }) => {
    try {
      const transcript = await getYoutubeTranscript(videoId);
      console.log("Fetched transcript:", transcript);
      return {
        cache: transcript.cache,
        transcript: transcript.transcript,
      };
    } catch (error) {
      console.error("[fetchTranscript] Error fetching transcript:", error);
      return {
        error: error instanceof Error ? error.message : "Failed to fetch transcript",
      };
    }
  },
});

export default fetchTranscript;
