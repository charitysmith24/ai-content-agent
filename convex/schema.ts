import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  videos: defineTable({
    // Identification
    videoId: v.string(),                    // YouTube video ID
    userId: v.string(),                     // User who analyzed the video
    
    // Video Metadata
    title: v.optional(v.string()),          // Original video title
    description: v.optional(v.string()),    // Video description
    duration: v.optional(v.number()),       // Duration in seconds
    thumbnailUrl: v.optional(v.string()),   // Original thumbnail URL
    channelName: v.optional(v.string()),    // Channel/creator name
    publishedAt: v.optional(v.string()),    // Original publish date
    viewCount: v.optional(v.number()),      // View count at analysis time
    
    // Analysis Metadata
    analyzedAt: v.optional(v.number()),     // Timestamp of analysis
    analysisStatus: v.optional(v.union(     // Analysis processing status
      v.literal("pending"),
      v.literal("processing"), 
      v.literal("completed"),
      v.literal("failed")
    )),
    analysisVersion: v.optional(v.string()), // Track analysis algorithm version
    
    // Settings & Preferences
    isPublic: v.optional(v.boolean()),       // User privacy setting
    tags: v.optional(v.array(v.string())),   // User-defined tags
    notes: v.optional(v.string()),           // User notes about the video
  })
    .index("by_user_id", ["userId"])
    .index("by_video_id", ["videoId"])
    .index("by_user_and_video", ["userId", "videoId"])
    .index("by_analysis_status", ["analysisStatus"])
    .index("by_analyzed_at", ["analyzedAt"]),

  transcript: defineTable({
    // Identification
    videoId: v.string(),
    userId: v.string(),
    
    // Transcript Data
    transcript: v.array(
      v.object({
        text: v.string(),
        timestamp: v.string(),
        startTime: v.optional(v.number()),     // Start time in seconds
        endTime: v.optional(v.number()),       // End time in seconds
        confidence: v.optional(v.number()),    // Transcription confidence score
      })
    ),
    
    // Metadata
    language: v.optional(v.string()),        // Detected/specified language
    totalDuration: v.optional(v.number()),   // Total transcript duration
    wordCount: v.optional(v.number()),       // Total word count
    
    // Processing Info
    transcriptionService: v.optional(v.string()), // Which service was used
    processedAt: v.optional(v.number()),    // When transcript was created
    version: v.optional(v.string()),         // Transcript version
    
    // Analysis Results
    sentiment: v.optional(v.object({         // Sentiment analysis results
      overall: v.string(),                   // positive/negative/neutral
      confidence: v.number(),
      details: v.optional(v.array(v.object({
        segment: v.string(),
        sentiment: v.string(),
        score: v.number(),
      })))
    })),
    
    keyTopics: v.optional(v.array(v.object({ // Extracted key topics
      topic: v.string(),
      relevance: v.number(),
      timestamps: v.array(v.string()),
    }))),
  })
    .index("by_video_id", ["videoId"])
    .index("by_user_id", ["userId"])
    .index("by_user_and_video", ["userId", "videoId"])
    .index("by_processed_at", ["processedAt"]),

  images: defineTable({
    // Identification
    userId: v.string(),
    videoId: v.string(),
    
    // Storage
    storageId: v.id("_storage"),             // Convex file storage ID
    fileName: v.optional(v.string()),        // Original filename
    fileSize: v.optional(v.number()),        // File size in bytes
    
    // Image Metadata
    imageType: v.optional(v.union(           // Type of generated image
      v.literal("thumbnail"),
      v.literal("cover"),
      v.literal("social_media"),
      v.literal("custom")
    )),
    dimensions: v.optional(v.object({        // Image dimensions
      width: v.number(),
      height: v.number(),
    })),
    
    // Generation Details
    prompt: v.optional(v.string()),          // AI prompt used for generation
    model: v.optional(v.string()),           // AI model used (dall-e-3, etc.)
    style: v.optional(v.string()),           // Style parameters
    quality: v.optional(v.string()),         // Quality setting
    
    // Metadata
    generatedAt: v.optional(v.number()),     // Timestamp of generation
    isActive: v.optional(v.boolean()),       // Currently active/selected
    downloadCount: v.optional(v.number()),   // How many times downloaded
    
    // User Interaction
    rating: v.optional(v.number()),          // User rating (1-5)
    feedback: v.optional(v.string()),        // User feedback
  })
    .index("by_user_id", ["userId"])
    .index("by_video_id", ["videoId"])
    .index("by_user_and_video", ["userId", "videoId"])
    .index("by_image_type", ["imageType"])
    .index("by_generated_at", ["generatedAt"])
    .index("by_active", ["isActive"]),

  titles: defineTable({
    // Identification
    userId: v.string(),
    videoId: v.string(),
    
    // Title Content
    title: v.string(),
    titleType: v.optional(v.union(           // Type of title
      v.literal("seo_optimized"),
      v.literal("clickbait"),
      v.literal("descriptive"),
      v.literal("branded"),
      v.literal("question"),
      v.literal("custom")
    )),
    
    // SEO & Analytics
    targetKeywords: v.optional(v.array(v.string())), // Target keywords
    estimatedCTR: v.optional(v.number()),    // Estimated click-through rate
    competitionLevel: v.optional(v.string()), // Keyword competition level
    
    // Generation Details
    prompt: v.optional(v.string()),          // AI prompt used
    model: v.optional(v.string()),           // AI model used
    generatedAt: v.optional(v.number()),     // Generation timestamp
    
    // User Interaction
    isSelected: v.optional(v.boolean()),     // Currently selected title
    performance: v.optional(v.object({       // Performance tracking
      views: v.optional(v.number()),
      clicks: v.optional(v.number()),
      ctr: v.optional(v.number()),
    })),
    
    // Metadata
    version: v.optional(v.string()),         // Version tracking
    rating: v.optional(v.number()),          // User rating
    notes: v.optional(v.string()),           // User notes
  })
    .index("by_video_id", ["videoId"])
    .index("by_user_id", ["userId"])
    .index("by_user_and_video", ["userId", "videoId"])
    .index("by_title_type", ["titleType"])
    .index("by_selected", ["isSelected"])
    .index("by_generated_at", ["generatedAt"]),

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

  storyboard_scenes: defineTable({
    scriptId: v.id("scripts"),
    userId: v.string(),
    videoId: v.string(),
    sceneIndex: v.number(),         // Order in the storyboard
    sceneContent: v.string(),       // The actual scene text/script
    sceneName: v.string(),          // Short descriptive name
    contentType: v.union(           // Type of scene content
      v.literal("intro"),
      v.literal("action"),
      v.literal("dialogue"),
      v.literal("transition"),
      v.literal("outro"),
      v.literal("other")
    ),
    emotion: v.optional(v.string()), // Emotional tone
    visualElements: v.optional(v.array(v.string())), // Key visual elements
    imageId: v.optional(v.id("_storage")), // Generated image for this scene
    voiceoverId: v.optional(v.id("voiceovers")), // Related voiceover if exists
    duration: v.optional(v.number()), // Estimated duration in seconds
    notes: v.optional(v.string()),  // Additional production notes
    createdAt: v.number(),
  })
    .index("by_script_id", ["scriptId"])
    .index("by_user_id", ["userId"])
    .index("by_video_id", ["videoId"])
    .index("by_scene_index", ["scriptId", "sceneIndex"])
    .index("by_content_type", ["contentType"]),

  voiceovers: defineTable({
    scriptId: v.id("scripts"),
    sceneId: v.optional(v.id("storyboard_scenes")), // Can be for a specific scene or entire script
    userId: v.string(),
    videoId: v.string(),
    storageId: v.id("_storage"),  // Audio file storage ID
    voiceName: v.string(),        // Name of the voice used
    voiceProvider: v.string(),    // ElevenLabs or other provider
    duration: v.optional(v.number()), // Duration in seconds
    text: v.string(),             // Text that was converted to speech
    createdAt: v.number(),
  })
    .index("by_script_id", ["scriptId"])
    .index("by_scene_id", ["sceneId"])
    .index("by_user_id", ["userId"])
    .index("by_video_id", ["videoId"]),

  chatHistory: defineTable({
    // Identification
    userId: v.string(),
    videoId: v.optional(v.string()),         // Optional: chat might be general
    sessionId: v.string(),                   // Chat session identifier
    
    // Message Content
    messages: v.array(v.object({
      id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      
      // Tool Usage (for assistant messages)
      toolCalls: v.optional(v.array(v.object({
        toolName: v.string(),
        parameters: v.optional(v.any()),
        result: v.optional(v.any()),
        executionTime: v.optional(v.number()),
      }))),
      
      // Metadata
      model: v.optional(v.string()),         // AI model used
      tokens: v.optional(v.object({         // Token usage
        input: v.number(),
        output: v.number(),
        total: v.number(),
      })),
    })),
    
    // Session Metadata
    startedAt: v.number(),
    lastMessageAt: v.number(),
    isActive: v.boolean(),
    
    // Context & Settings
    context: v.optional(v.object({          // Chat context
      videoTitle: v.optional(v.string()),
      analysisData: v.optional(v.any()),
      userPreferences: v.optional(v.any()),
    })),
    
    // Analytics
    totalMessages: v.number(),
    totalTokens: v.optional(v.number()),
    averageResponseTime: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_video_id", ["videoId"])
    .index("by_session_id", ["sessionId"])
    .index("by_user_and_video", ["userId", "videoId"])
    .index("by_active", ["isActive"])
    .index("by_last_message", ["lastMessageAt"]),

  userAnalytics: defineTable({
    // Identification
    userId: v.string(),
    date: v.string(),                        // YYYY-MM-DD format
    
    // Usage Metrics
    videosAnalyzed: v.number(),
    imagesGenerated: v.number(),
    titlesGenerated: v.number(),
    scriptsGenerated: v.number(),
    chatMessages: v.number(),
    
    // Feature Usage
    featureUsage: v.object({
      transcription: v.number(),
      imageGeneration: v.number(),
      titleGeneration: v.number(),
      scriptGeneration: v.number(),
      chatInteractions: v.number(),
    }),
    
    // Subscription & Billing
    subscriptionTier: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    creditsRemaining: v.optional(v.number()),
    
    // Performance Metrics
    avgProcessingTime: v.optional(v.number()),
    successfulOperations: v.number(),
    failedOperations: v.number(),
    
    // Engagement
    sessionDuration: v.optional(v.number()),
    pageViews: v.optional(v.number()),
    
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_date", ["date"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_subscription_tier", ["subscriptionTier"]),
});
