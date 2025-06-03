import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

// This endpoint is called by n8n when a voiceover job is complete
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.voiceoverId) {
      return NextResponse.json(
        { error: "Missing voiceoverId" },
        { status: 400 }
      );
    }

    // Create a Convex HTTP client
    const convexClient = new ConvexHttpClient(
      process.env.NEXT_PUBLIC_CONVEX_URL!
    );

    // Call the Convex HTTP action to handle the callback
    // Note: We need to use a different approach since httpAction isn't directly
    // exposed in the generated API
    await fetch(
      `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/voiceover/callback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceoverId: data.voiceoverId,
          success: data.success ?? false,
          audioBase64: data.audioBase64,
          duration: data.duration,
          errorMessage: data.errorMessage,
        }),
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling voiceover callback:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
