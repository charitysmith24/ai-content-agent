import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// get video by id
export const getVideoById = query({
  args: { videoId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .unique();
  },
});

export const createVideoEntry = mutation({
  args: {
    videoId: v.string(),
    userId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    channelName: v.optional(v.string()),
    publishedAt: v.optional(v.string()),
    viewCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const videoId = await ctx.db.insert("videos", {
      videoId: args.videoId,
      userId: args.userId,
      title: args.title,
      description: args.description,
      duration: args.duration,
      thumbnailUrl: args.thumbnailUrl,
      channelName: args.channelName,
      publishedAt: args.publishedAt,
      viewCount: args.viewCount,
      analyzedAt: Date.now(),
      analysisStatus: "pending",
    });
    return videoId;
  },
});

// New function to update video analysis status
export const updateVideoAnalysisStatus = mutation({
  args: {
    videoId: v.string(),
    userId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    analysisVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_user_and_video", q => 
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .unique();
    
    if (!video) {
      throw new Error("Video not found");
    }
    
    await ctx.db.patch(video._id, {
      analysisStatus: args.status,
      analysisVersion: args.analysisVersion,
    });
    
    return video._id;
  },
});
