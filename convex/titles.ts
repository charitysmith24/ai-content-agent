import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    videoId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("titles")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .collect();
  },
});

export const getLatestTitle = query({
  args: {
    videoId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const latestTitle = await ctx.db
      .query("titles")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .order("desc") // Get most recent
      .first();
    
    return latestTitle?.title || null;
  },
});

export const generate = mutation({
  args: {
    videoId: v.string(),
    userId: v.string(),
    title: v.string(),
    titleType: v.optional(v.union(
      v.literal("seo_optimized"),
      v.literal("clickbait"),
      v.literal("descriptive"),
      v.literal("branded"),
      v.literal("question"),
      v.literal("custom")
    )),
    targetKeywords: v.optional(v.array(v.string())),
    estimatedCTR: v.optional(v.number()),
    competitionLevel: v.optional(v.string()),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
    isSelected: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // If setting as selected, unselect all other titles
    if (args.isSelected) {
      const existingTitles = await ctx.db
        .query("titles")
        .withIndex("by_user_and_video", (q) =>
          q.eq("userId", args.userId).eq("videoId", args.videoId)
        )
        .collect();
      
      for (const title of existingTitles) {
        await ctx.db.patch(title._id, { isSelected: false });
      }
    }
    
    // Store the generated title with enhanced metadata
    const titleId = await ctx.db.insert("titles", {
      videoId: args.videoId,
      userId: args.userId,
      title: args.title,
      titleType: args.titleType,
      targetKeywords: args.targetKeywords,
      estimatedCTR: args.estimatedCTR,
      competitionLevel: args.competitionLevel,
      prompt: args.prompt,
      model: args.model,
      generatedAt: Date.now(),
      isSelected: args.isSelected || false,
      performance: {
        views: 0,
        clicks: 0,
        ctr: 0,
      },
    });

    return titleId;
  },
});

// New function to select a title
export const selectTitle = mutation({
  args: {
    titleId: v.id("titles"),
  },
  handler: async (ctx, args) => {
    const title = await ctx.db.get(args.titleId);
    if (!title) {
      throw new Error("Title not found");
    }
    
    // Unselect all titles for this video
    const otherTitles = await ctx.db
      .query("titles")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", title.userId).eq("videoId", title.videoId)
      )
      .collect();
    
    for (const otherTitle of otherTitles) {
      await ctx.db.patch(otherTitle._id, { isSelected: false });
    }
    
    // Select this title
    await ctx.db.patch(args.titleId, { isSelected: true });
    
    return args.titleId;
  },
});

// New function to update title performance metrics
export const updateTitlePerformance = mutation({
  args: {
    titleId: v.id("titles"),
    views: v.optional(v.number()),
    clicks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const title = await ctx.db.get(args.titleId);
    if (!title) {
      throw new Error("Title not found");
    }
    
    // Define the performance object structure with default values
    const currentPerformance = {
      views: 0,
      clicks: 0,
      ctr: 0,
      ...(title.performance || {})
    };
    
    // Update metrics that were provided with explicit typing
    const updatedPerformance = {
      views: args.views ?? currentPerformance.views,
      clicks: args.clicks ?? currentPerformance.clicks,
      ctr: 0, // Will be calculated below
    };
    
    // Calculate CTR if we have views
    if (updatedPerformance.views > 0) {
      updatedPerformance.ctr = (updatedPerformance.clicks / updatedPerformance.views) * 100;
    }
    
    await ctx.db.patch(args.titleId, { 
      performance: updatedPerformance 
    });
    
    return args.titleId;
  },
});
