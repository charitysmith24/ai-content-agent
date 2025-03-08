"use server";

import { google } from "googleapis";
import { VideoDetails } from "@/types/types";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export async function getVideoDetails(videoId: string) {
  console.log("🎥 Initiating YouTube API request for video details:", videoId);
  try {
    // Fetch video details from the Youtube API
    const videoResponse = await youtube.videos.list({
      part: ["snippet", "statistics"],
      id: [videoId],
    });

    // Extract the video details
    const videoDetails = videoResponse.data.items?.[0];
    if (!videoDetails) {
      console.error("❌ Video not found in YouTube API response for ID:", videoId);
      throw new Error("Video not found");
    }

    console.log("📺 Successfully retrieved video details from YouTube API");
    console.log("🔍 Fetching channel details for channel ID:", videoDetails.snippet?.channelId);

    // Get channel details
    const channelResponse = await youtube.channels.list({
      part: ["snippet", "statistics"],
      id: [videoDetails.snippet?.channelId || ""],
      key: process.env.YOUTUBE_API_KEY,
    });

    const channelDetails = channelResponse.data.items?.[0];
    if (!channelDetails) {
      console.error("❌ Channel not found in YouTube API response for channel ID:", videoDetails.snippet?.channelId);
      throw new Error("Channel not found");
    }

    console.log("👥 Successfully retrieved channel details from YouTube API");

    const video: VideoDetails = {
      // Video Info
      title: videoDetails.snippet?.title || "Unknown Title",
      thumbnail:
        videoDetails.snippet?.thumbnails?.maxres?.url ||
        videoDetails.snippet?.thumbnails?.high?.url ||
        videoDetails.snippet?.thumbnails?.default?.url ||
        "",
      publishedAt:
        videoDetails.snippet?.publishedAt || new Date().toISOString(),
      description: videoDetails.snippet?.description || "No Description",
      // Video Metrics
      views: videoDetails.statistics?.viewCount || "0",
      likes: videoDetails.statistics?.likeCount || "Not Available",
      comments: videoDetails.statistics?.commentCount || "Not Available",
      // Channel Info
      channel: {
        title: videoDetails.snippet?.channelTitle || "Unknown Channel",
        thumbnail: channelDetails.snippet?.thumbnails?.default?.url || "",
        subscribers: channelDetails.statistics?.subscriberCount || "0",
      },
    };

    return video;
  } catch (error) {
    console.error("❌ Failed to fetch video details:", {
      videoId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
