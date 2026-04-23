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
import arcjet, { shield, slidingWindow } from "@arcjet/next";

// Image generation (gpt-image-1.5) can take 60–90s. Without this, Vercel
// silently closes the stream at its default 60s limit, causing tool calls
// to appear successful on the client while producing no output.
export const maxDuration = 300;

const anthropic = createAnthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const model = anthropic("claude-sonnet-4-6");

// Rate limit per authenticated user (not per IP) so each user has their own
// quota. slidingWindow is used over fixedWindow to prevent burst exploitation
// at window boundaries (e.g. 20 rapid clicks just before and after a reset).
// 20 requests per 5 minutes = ~4/min average, enough for normal usage while
// preventing concurrent long-running tool calls (image/script generation)
// from running up unbounded compute costs.
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userId"],
  rules: [
    shield({ mode: "LIVE" }),
    slidingWindow({
      mode: "LIVE",
      window: "5m",
      max: 20,
    }),
  ],
});

export async function POST(req: Request) {
  // Authenticate first so the user ID can be passed to Arcjet for
  // per-user rate limiting rather than the default per-IP limiting.
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decision = await aj.protect(req, { userId: user.id });

  console.log("Arcjet Decision:", decision.conclusion);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Request blocked for security reasons." },
      { status: 403 }
    );
  }

  const { messages: rawMessages, videoId } = await req.json();

  // Strip incomplete tool invocations from the conversation history.
  // When a tool call fails mid-stream (e.g. a model error), useChat stores it
  // with state:"call" and no result. Passing that to streamText causes
  // AI_MessageConversionError because Anthropic requires every tool call to
  // have a matching result. Filtering them out here keeps the history valid.
  const messages = rawMessages.map(
    (msg: {
      role: string;
      toolInvocations?: Array<{ state: string }>;
      parts?: Array<{ type: string; toolInvocation?: { state: string } }>;
    }) => {
      if (msg.role !== "assistant") return msg;
      return {
        ...msg,
        toolInvocations: msg.toolInvocations?.filter(
          (inv) => inv.state === "result"
        ),
        parts: msg.parts?.filter(
          (part) =>
            part.type !== "tool-invocation" ||
            part.toolInvocation?.state === "result"
        ),
      };
    }
  );

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
    onError: ({ error }) => {
      console.error("[Chat API] streamText error:", error);
    },
    onFinish: ({ usage, finishReason, steps }) => {
      console.log("[Chat API] Stream finished:", {
        finishReason,
        steps: steps.length,
        usage,
      });
    },
  });

  return result.toDataStreamResponse();
}
