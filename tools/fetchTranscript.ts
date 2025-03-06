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
    const transcript = await getYoutubeTranscript(videoId);
    console.log("Fetched transcript:", transcript);
    return {
      cache: transcript.cache, // Whether the transcript was fetched from the cache
      transcript: transcript.transcript, // The transcript of the video
    };
  },
});

export default fetchTranscript;
