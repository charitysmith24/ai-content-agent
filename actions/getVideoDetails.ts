"use server";

import { google } from "googleapis";
import { VideoDetails } from "@/types/types";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export async function getVideoDetails(videoId: string) {
  console.log("fetching video details for: ", videoId);
  try {
    // Fetch video details from the Youtube API
    const videoResponse = await youtube.videos.list({
      part: ["snippet", "statistics"],
      id: [videoId],
    });

    // Extract the video details
    const videoDetails = videoResponse.data.items?.[0];
    if (!videoDetails) throw new Error("Video not found");

    // Get channel details
    const channelResponse = await youtube.channels.list({
      part: ["snippet", "statistics"],
      id: [videoDetails.snippet?.channelId || ""],
      key: process.env.YOUTUBE_API_KEY,
    });

    const channelDetails = channelResponse.data.items?.[0];
    if (!channelDetails) throw new Error("Channel not found");

    console.log("Video details retrieved sucessfully");

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
    console.error("Failed to fetch video details: ", error);
    return null;
  }
}
