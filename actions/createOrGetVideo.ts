"use server";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { checkFeatureUsageLimit } from "@/lib/checkFeatureUsageLimit";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";

export interface VideoResponse {
  success: boolean;
  data?: Doc<"videos">;
  error?: string;
}

export const createOrGetVideo = async (
  videoId: string,
  userId: string
): Promise<VideoResponse> => {
  console.log("🎬 Starting video creation/retrieval process", { videoId, userId });
  const convex = getConvexClient();
  const user = await currentUser();

  if (!user) {
    console.error("❌ Authentication error: User not found");
    return {
      success: false,
      error: "User not found",
    };
  }

  console.log("🔒 User authenticated successfully", { userId: user.id });
  const featureCheck = await checkFeatureUsageLimit(
    user.id,
    featureFlagEvents[FeatureFlag.ANALYSE_VIDEO].event
  );

  if (!featureCheck.success) {
    console.error("❌ Feature usage limit exceeded", {
      userId: user.id,
      feature: FeatureFlag.ANALYSE_VIDEO,
      error: featureCheck.error
    });
    return {
      success: false,
      error: featureCheck.error,
    };
  }

  try {
    console.log("🔍 Checking for existing video in database");
    const video = await convex.query(api.videos.getVideoById, {
      videoId,
      userId,
    });

    if (!video) {
      console.log("📝 No existing video found - creating new entry", { videoId });
      console.log("🔍 Analyse event for video - Token will be spent");

      const newVideoId = await convex.mutation(api.videos.createVideoEntry, {
        videoId,
        userId,
      });
      console.log("✅ New video entry created successfully", { newVideoId });

      const newVideo = await convex.query(api.videos.getVideoById, {
        videoId: newVideoId,
        userId,
      });

      console.log("📊 Tracking analyse video event");
      await client.track({
        event: featureFlagEvents[FeatureFlag.ANALYSE_VIDEO].event,
        company: {
          id: userId,
        },
        user: {
          id: userId,
        },
      });
      console.log("✅ Analysis event tracked successfully");

      return {
        success: true,
        data: newVideo!,
      };
    } else {
      console.log("✅ Existing video found - no token needed", { videoId });
      return {
        success: true,
        data: video,
      };
    }
  } catch (error) {
    console.error("❌ Error in video creation/retrieval process:", {
      videoId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
};
