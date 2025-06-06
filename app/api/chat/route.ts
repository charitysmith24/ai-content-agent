import { NextResponse } from "next/server";
import { tool } from "ai";
import { z } from "zod";
import { streamText } from "ai";
import { getVideoDetails } from "@/actions/getVideoDetails";
import fetchTranscript from "@/tools/fetchTranscript";
import { generateImage } from "@/tools/generateImage";
import generateScript from "@/tools/generateScript";
import { getVideoFormUrl } from "@/lib/getVideoFormUrl";
import { createAnthropic } from "@ai-sdk/anthropic";
import { currentUser } from "@clerk/nextjs/server";
import generateTitle from "@/tools/generateTitle";
import arcjet, { shield, fixedWindow } from "@arcjet/next";


const anthropic = createAnthropic({
  // custom settings
  apiKey: process.env.CLAUDE_API_KEY,
  headers: {
    "anthropic-beta": "token-efficient-tools-2025-02-19",
  },
});

const model = anthropic("claude-3-7-sonnet-20250219");

// Configure Arcjet with security rules specific to this API endpoint
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Protect against common attacks with Shield
    shield({
      mode: "DRY_RUN", // Start in DRY_RUN mode to monitor without blocking
    }),
    // Rate limit requests to prevent abuse
    fixedWindow({
      mode: "DRY_RUN", // Start in DRY_RUN mode
      window: "5m", // 5 minute window
      max: 30, // Maximum 30 requests per window
    }),
  ],
});

export async function POST(req: Request) {
  // Apply Arcjet protection to this route
  const decision = await aj.protect(req);

  // Log decision results for monitoring
  console.log("Arcjet Decision:", decision.conclusion);

  // If the request is denied by Arcjet, return a 429 response
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    } else {
      return NextResponse.json(
        { error: "Request blocked for security reasons." },
        { status: 403 }
      );
    }
  }

  const { messages, videoId } = await req.json();
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videoDetails = await getVideoDetails(videoId);

  const systemMessage = `You are an AI agent ready to accept questions from the user about ONE specific video. The video ID in question
  is ${videoId} but you'll refer to this as ${videoDetails?.title || "Selected Video"}. Use emojis to make the coversation more engaging.
  If an error occurs, explain it to the user and them to try again later. If the error suggest the user upgrade, explain that they must
  upgrade to use this feature, tell them to go to 'Manage Plan" in the header and upgrade. If any tool is used, analyse the response and if it contains
  a cache, explain that the transcript is cached because they previously transcribed the video saving the user a token - use words like database
  instead of cache to make it more easy to understand. Format for notion.`;

  const result = streamText({
    model,
    messages: [
      {
        role: "system",
        content: systemMessage,
        providerOptions: {
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      },
      ...messages,
    ],
    tools: {
      extractVideoId: tool({
        description: "Extract the video ID from a URL",
        parameters: z.object({
          url: z.string().describe("The URL to extract the video ID from"),
        }),
        execute: async ({ url }) => {
          const videoId = await getVideoFormUrl(url);
          return { videoId };
        },
      }),
      getVideoDetails: tool({
        description: "Get the details of a YouTube video",
        parameters: z.object({
          videoId: z.string().describe("The video ID to get the details for"),
        }),
        execute: async ({ videoId }: { videoId: string }) => {
          const videoDetails = await getVideoDetails(videoId);
          return { videoDetails };
        },
      }),
      fetchTranscript: fetchTranscript,
      generateImage: generateImage(videoId, user.id),
      generateTitle: generateTitle(user.id),
      generateScript: generateScript(user.id),
    },
  });

  console.log({ result });

  return result.toDataStreamResponse();
}
