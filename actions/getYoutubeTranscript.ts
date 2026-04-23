"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { fetchTranscript as ytFetchTranscript } from "youtube-transcript-plus";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface TranscriptEntry {
  text: string;
  timestamp: string;
}

function formatTimestamp(offsetSeconds: number): string {
  const minutes = Math.floor(offsetSeconds / 60);
  const seconds = Math.floor(offsetSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Vercel/cloud datacenter IPs are blocked by YouTube. Route all requests
// through a Webshare residential proxy when WEBSHARE_PROXY_URL is set.
// Format: http://<username>:<password>@p.webshare.io:80
// Falls back to direct fetch in local development when the variable is absent.
function buildProxyFetch() {
  const proxyUrl = process.env.WEBSHARE_PROXY_URL;
  if (!proxyUrl) return {};

  const dispatcher = new ProxyAgent(proxyUrl);

  const proxiedFetch = (
    url: string,
    init: Record<string, unknown> = {}
  ) =>
    undiciFetch(url, { ...init, dispatcher } as Parameters<
      typeof undiciFetch
    >[1]) as unknown as Promise<Response>;

  return {
    videoFetch: ({ url, lang, userAgent }: { url: string; lang?: string; userAgent?: string }) =>
      proxiedFetch(url, {
        headers: {
          ...(lang && { "Accept-Language": lang }),
          ...(userAgent && { "User-Agent": userAgent }),
        },
      }),
    playerFetch: ({
      url,
      method,
      body,
      headers,
      lang,
      userAgent,
    }: {
      url: string;
      method?: string;
      body?: string;
      headers?: Record<string, string>;
      lang?: string;
      userAgent?: string;
    }) =>
      proxiedFetch(url, {
        method,
        body,
        headers: {
          ...headers,
          ...(lang && { "Accept-Language": lang }),
          ...(userAgent && { "User-Agent": userAgent }),
        },
      }),
    transcriptFetch: ({ url, lang, userAgent }: { url: string; lang?: string; userAgent?: string }) =>
      proxiedFetch(url, {
        headers: {
          ...(lang && { "Accept-Language": lang }),
          ...(userAgent && { "User-Agent": userAgent }),
        },
      }),
  };
}

async function fetchTranscript(videoId: string): Promise<TranscriptEntry[]> {
  const segments = await ytFetchTranscript(videoId, {
    lang: "en",
    ...buildProxyFetch(),
  });

  return segments.map((segment) => ({
    text: segment.text,
    timestamp: formatTimestamp(segment.offset),
  }));
}

export async function getYoutubeTranscript(videoId: string) {
  console.log(`🚀 Starting transcript retrieval for video ID: ${videoId}`);
  const user = await currentUser();
  console.log(
    `👤 User authentication check: ${user?.id ? "Successful" : "Failed"}`
  );

  if (!user?.id) {
    console.log("❌ Error: User not found");
    throw new Error("User not found");
  }

  console.log(
    `🔍 Checking database for existing transcript for video: ${videoId}`
  );

  // TODO: Check if transcript already exists in database (is it cached?)
  const existingTranscript = await convex.query(
    api.transcript.getTranscriptByVideoId,
    { videoId, userId: user.id }
  );

  if (existingTranscript) {
    console.log(`✅ Transcript found in database for video: ${videoId}`);
    console.log(
      `📊 Transcript length: ${existingTranscript.transcript.length} segments`
    );
    return {
      cache:
        "This video has already been transcribed - Accessing cached transcript instead of using a token",
      transcript: existingTranscript.transcript,
    };
  }

  // If not, fetch the transcript from YouTube
  console.log(
    `🔄 No existing transcript found. Fetching new transcript from YouTube...`
  );

  console.log("Fetching transcript for video ID:", videoId);
  try {
    console.log(`📥 Calling YouTube API for video: ${videoId}`);
    const transcript = await fetchTranscript(videoId);
    console.log(
      `📝 Successfully retrieved transcript with ${transcript.length} segments`
    );

    console.log(`💾 Storing transcript in database...`);
    // Store transcript in database
    await convex.mutation(api.transcript.storeTranscript, {
      videoId,
      userId: user.id,
      transcript,
    });
    console.log(`✅ Transcript successfully stored in database`);

    console.log(`📊 Tracking transcription event with Schematic`);
    await client.track({
      event: featureFlagEvents[FeatureFlag.TRANSCRIPTION].event,
      company: {
        id: user.id,
      },
      user: {
        id: user.id,
      },
    });
    console.log(`✅ Event tracking complete`);

    return {
      transcript,
      cache:
        "This video was transcribed using a token, the transcript is now saved in the database",
    };
  } catch (error) {
    console.error("❌ Error fetching transcript:", error);
    console.log(`⚠️ Returning empty transcript due to error`);
    return {
      transcript: [],
      cache: "Error fetching transcript, please try again later",
    };
  }
}
