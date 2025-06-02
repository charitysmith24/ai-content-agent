import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get transcript by video ID
export const getTranscriptByVideoId = query({
  args: {
    videoId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcript")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .unique();
  },
});

// Store a transcript for a video
export const storeTranscript = mutation({
  args: {
    videoId: v.string(),
    userId: v.string(),
    transcript: v.array(
      v.object({
        text: v.string(),
        timestamp: v.string(),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        confidence: v.optional(v.number()),
      })
    ),
    language: v.optional(v.string()),
    totalDuration: v.optional(v.number()),
    wordCount: v.optional(v.number()),
    transcriptionService: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if transcript already exists for this user and video
    const existingTranscript = await ctx.db
      .query("transcript")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .unique();

    if (existingTranscript) {
      // Update the existing transcript with new data
      return await ctx.db.patch(existingTranscript._id, {
        transcript: args.transcript,
        language: args.language,
        totalDuration: args.totalDuration,
        wordCount: args.wordCount,
        transcriptionService: args.transcriptionService,
        processedAt: Date.now(),
      });
    }

    // Create new transcript
    return await ctx.db.insert("transcript", {
      videoId: args.videoId,
      userId: args.userId,
      transcript: args.transcript,
      language: args.language,
      totalDuration: args.totalDuration,
      wordCount: args.wordCount,
      transcriptionService: args.transcriptionService,
      processedAt: Date.now(),
    });
  },
});

// Get all transcripts for a user
export const getTranscriptsByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcript")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Delete transcript by ID
export const deleteTranscript = mutation({
  args: { id: v.id("transcript"), userId: v.string() },
  handler: async (ctx, args) => {
    const transcript = await ctx.db.get(args.id);
    if (!transcript) {
      throw new Error("Transcript not found");
    }

    if (transcript.userId !== args.userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

// New function to add sentiment analysis to transcript
export const addSentimentAnalysis = mutation({
  args: {
    transcriptId: v.id("transcript"),
    overall: v.string(),
    confidence: v.number(),
    details: v.optional(v.array(
      v.object({
        segment: v.string(),
        sentiment: v.string(),
        score: v.number(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const transcript = await ctx.db.get(args.transcriptId);
    
    if (!transcript) {
      throw new Error("Transcript not found");
    }
    
    await ctx.db.patch(args.transcriptId, {
      sentiment: {
        overall: args.overall,
        confidence: args.confidence,
        details: args.details,
      }
    });
    
    return args.transcriptId;
  },
});

// New function to add key topics to transcript
export const addKeyTopics = mutation({
  args: {
    transcriptId: v.id("transcript"),
    keyTopics: v.array(
      v.object({
        topic: v.string(),
        relevance: v.number(),
        timestamps: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const transcript = await ctx.db.get(args.transcriptId);
    
    if (!transcript) {
      throw new Error("Transcript not found");
    }
    
    await ctx.db.patch(args.transcriptId, {
      keyTopics: args.keyTopics,
    });
    
    return args.transcriptId;
  },
});
