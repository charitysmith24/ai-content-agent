import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  videos: defineTable({
    videoId: v.string(),
    userId: v.string(),
  })
    .index("by_user_id", ["userId"])
    .index("by_video_id", ["videoId"])
    .index("by_user_and_video", ["userId", "videoId"]),

  transcript: defineTable({
    videoId: v.string(),
    userId: v.string(),
    transcript: v.array(
      v.object({
        text: v.string(),
        timestamp: v.string(),
      })
    ),
  })
    .index("by_video_id", ["videoId"])
    .index("by_user_id", ["userId"])
    .index("by_user_and_video", ["userId", "videoId"]),

  images: defineTable({
    storageId: v.id("_storage"),
    userId: v.string(),
    videoId: v.string(),
  })
    .index("by_user_id", ["userId"])
    .index("by_video_id", ["videoId"])
    .index("by_user_and_video", ["userId", "videoId"]),

  titles: defineTable({
    videoId: v.string(),
    userId: v.string(),
    title: v.string(),
  })
    .index("by_video_id", ["videoId"])
    .index("by_user_id", ["userId"])
    .index("by_user_and_video", ["userId", "videoId"]),

  scripts: defineTable({
    videoId: v.string(),
    userId: v.string(),
    script: v.string(),
    
    // Title Integration
    scriptTitle: v.string(),                    // Human-readable script name
    videoTitle: v.optional(v.string()),         // Original video title
    generatedTitle: v.optional(v.string()),     // AI-generated title (if exists)
    titleSource: v.union(                       // Where title came from
      v.literal("original_video"),
      v.literal("ai_generated"), 
      v.literal("user_defined"),
      v.literal("auto_generated")
    ),
    
    // Enhanced Metadata
    scriptType: v.optional(v.union(
      v.literal("tutorial"),
      v.literal("marketing"),
      v.literal("entertainment"),
      v.literal("educational"),
      v.literal("general")
    )),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_video_id", ["videoId"])
    .index("by_user_id", ["userId"])
    .index("by_user_and_video", ["userId", "videoId"])
    .index("by_title_source", ["titleSource"])
    .index("by_script_type", ["scriptType"])
    .index("by_created_at", ["createdAt"]),
});
