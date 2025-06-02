import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get analytics for a specific user
export const getUserAnalytics = query({
  args: {
    userId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let analyticsQuery = ctx.db
      .query("userAnalytics")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));
    
    // Apply date filters if provided
    if (args.startDate && args.endDate) {
      analyticsQuery = analyticsQuery
        .filter((q) => q.gte(q.field("date"), args.startDate!))
        .filter((q) => q.lte(q.field("date"), args.endDate!));
    }
    
    // Sort by date (newest first)
    const orderedQuery = analyticsQuery.order("desc");
    
    // Apply limit if provided
    if (args.limit) {
      return await orderedQuery.take(args.limit);
    }
    
    return await orderedQuery.collect();
  },
});

// Get analytics for a specific date
export const getAnalyticsByDate = query({
  args: {
    userId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("userAnalytics")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
    
    return analytics;
  },
});

// Track user activity - creates or updates analytics for the current day
export const trackUserActivity = mutation({
  args: {
    userId: v.string(),
    activity: v.object({
      videosAnalyzed: v.optional(v.number()),
      imagesGenerated: v.optional(v.number()),
      titlesGenerated: v.optional(v.number()),
      scriptsGenerated: v.optional(v.number()),
      chatMessages: v.optional(v.number()),
      
      // Feature usage breakdown
      transcription: v.optional(v.number()),
      imageGeneration: v.optional(v.number()),
      titleGeneration: v.optional(v.number()),
      scriptGeneration: v.optional(v.number()),
      chatInteractions: v.optional(v.number()),
    }),
    subscriptionData: v.optional(v.object({
      tier: v.string(),
      tokensUsed: v.number(),
      creditsRemaining: v.number(),
    })),
    performance: v.optional(v.object({
      processingTime: v.number(),
      isSuccess: v.boolean(),
      sessionDuration: v.optional(v.number()),
      pageViews: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Try to find an existing record for today
    const existingAnalytics = await ctx.db
      .query("userAnalytics")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();
    
    if (existingAnalytics) {
      // Update existing record
      const updates: Record<string, any> = {
        updatedAt: Date.now(),
      };
      
      // Update activity counts
      if (args.activity.videosAnalyzed) {
        updates.videosAnalyzed = existingAnalytics.videosAnalyzed + args.activity.videosAnalyzed;
      }
      if (args.activity.imagesGenerated) {
        updates.imagesGenerated = existingAnalytics.imagesGenerated + args.activity.imagesGenerated;
      }
      if (args.activity.titlesGenerated) {
        updates.titlesGenerated = existingAnalytics.titlesGenerated + args.activity.titlesGenerated;
      }
      if (args.activity.scriptsGenerated) {
        updates.scriptsGenerated = existingAnalytics.scriptsGenerated + args.activity.scriptsGenerated;
      }
      if (args.activity.chatMessages) {
        updates.chatMessages = existingAnalytics.chatMessages + args.activity.chatMessages;
      }
      
      // Update feature usage
      const featureUsage = { ...existingAnalytics.featureUsage };
      if (args.activity.transcription) {
        featureUsage.transcription += args.activity.transcription;
      }
      if (args.activity.imageGeneration) {
        featureUsage.imageGeneration += args.activity.imageGeneration;
      }
      if (args.activity.titleGeneration) {
        featureUsage.titleGeneration += args.activity.titleGeneration;
      }
      if (args.activity.scriptGeneration) {
        featureUsage.scriptGeneration += args.activity.scriptGeneration;
      }
      if (args.activity.chatInteractions) {
        featureUsage.chatInteractions += args.activity.chatInteractions;
      }
      updates.featureUsage = featureUsage;
      
      // Update subscription data if provided
      if (args.subscriptionData) {
        updates.subscriptionTier = args.subscriptionData.tier;
        updates.tokensUsed = args.subscriptionData.tokensUsed;
        updates.creditsRemaining = args.subscriptionData.creditsRemaining;
      }
      
      // Update performance metrics
      if (args.performance) {
        // Update average processing time
        const currentAvg = existingAnalytics.avgProcessingTime || 0;
        const currentOps = existingAnalytics.successfulOperations + existingAnalytics.failedOperations;
        const newAvg = ((currentAvg * currentOps) + args.performance.processingTime) / (currentOps + 1);
        updates.avgProcessingTime = newAvg;
        
        // Update success/failure counts
        if (args.performance.isSuccess) {
          updates.successfulOperations = existingAnalytics.successfulOperations + 1;
        } else {
          updates.failedOperations = existingAnalytics.failedOperations + 1;
        }
        
        // Update session metrics if provided
        if (args.performance.sessionDuration !== undefined) {
          updates.sessionDuration = (existingAnalytics.sessionDuration || 0) + args.performance.sessionDuration;
        }
        if (args.performance.pageViews !== undefined) {
          updates.pageViews = (existingAnalytics.pageViews || 0) + args.performance.pageViews;
        }
      }
      
      await ctx.db.patch(existingAnalytics._id, updates);
      return existingAnalytics._id;
    } else {
      // Create a new record for today
      const analyticsData = {
        userId: args.userId,
        date: today,
        videosAnalyzed: args.activity.videosAnalyzed || 0,
        imagesGenerated: args.activity.imagesGenerated || 0,
        titlesGenerated: args.activity.titlesGenerated || 0,
        scriptsGenerated: args.activity.scriptsGenerated || 0,
        chatMessages: args.activity.chatMessages || 0,
        
        featureUsage: {
          transcription: args.activity.transcription || 0,
          imageGeneration: args.activity.imageGeneration || 0,
          titleGeneration: args.activity.titleGeneration || 0,
          scriptGeneration: args.activity.scriptGeneration || 0,
          chatInteractions: args.activity.chatInteractions || 0,
        },
        
        // Initialize with subscription data if provided
        subscriptionTier: args.subscriptionData?.tier,
        tokensUsed: args.subscriptionData?.tokensUsed || 0,
        creditsRemaining: args.subscriptionData?.creditsRemaining,
        
        // Initialize performance metrics
        avgProcessingTime: args.performance?.processingTime,
        successfulOperations: args.performance?.isSuccess ? 1 : 0,
        failedOperations: args.performance?.isSuccess ? 0 : 1,
        sessionDuration: args.performance?.sessionDuration,
        pageViews: args.performance?.pageViews,
        
        updatedAt: Date.now(),
      };
      
      const analyticsId = await ctx.db.insert("userAnalytics", analyticsData);
      return analyticsId;
    }
  },
});

// Get user summary statistics across all time
export const getUserSummaryStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const allAnalytics = await ctx.db
      .query("userAnalytics")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Aggregate statistics
    const summary = {
      totalVideosAnalyzed: 0,
      totalImagesGenerated: 0,
      totalTitlesGenerated: 0,
      totalScriptsGenerated: 0,
      totalChatMessages: 0,
      featureUsage: {
        transcription: 0,
        imageGeneration: 0,
        titleGeneration: 0,
        scriptGeneration: 0,
        chatInteractions: 0,
      },
      totalTokensUsed: 0,
      averageProcessingTime: 0,
      totalSuccessfulOperations: 0,
      totalFailedOperations: 0,
      successRate: 0,
      activeDays: allAnalytics.length,
      firstActiveDate: allAnalytics.length > 0 ? allAnalytics[0].date : null,
      lastActiveDate: null as string | null,
    };
    
    // Process each day's data
    let totalProcessingTimeWeighted = 0;
    let totalOperations = 0;
    
    allAnalytics.forEach(day => {
      // Update totals
      summary.totalVideosAnalyzed += day.videosAnalyzed;
      summary.totalImagesGenerated += day.imagesGenerated;
      summary.totalTitlesGenerated += day.titlesGenerated;
      summary.totalScriptsGenerated += day.scriptsGenerated;
      summary.totalChatMessages += day.chatMessages;
      
      // Update feature usage
      summary.featureUsage.transcription += day.featureUsage.transcription;
      summary.featureUsage.imageGeneration += day.featureUsage.imageGeneration;
      summary.featureUsage.titleGeneration += day.featureUsage.titleGeneration;
      summary.featureUsage.scriptGeneration += day.featureUsage.scriptGeneration;
      summary.featureUsage.chatInteractions += day.featureUsage.chatInteractions;
      
      // Update tokens
      if (day.tokensUsed) {
        summary.totalTokensUsed += day.tokensUsed;
      }
      
      // Calculate weighted average processing time
      const dayOperations = day.successfulOperations + day.failedOperations;
      if (day.avgProcessingTime && dayOperations > 0) {
        totalProcessingTimeWeighted += day.avgProcessingTime * dayOperations;
        totalOperations += dayOperations;
      }
      
      summary.totalSuccessfulOperations += day.successfulOperations;
      summary.totalFailedOperations += day.failedOperations;
      
      // Track first and last active dates
      if (!summary.firstActiveDate || day.date < summary.firstActiveDate) {
        summary.firstActiveDate = day.date;
      }
      if (!summary.lastActiveDate || (summary.lastActiveDate && day.date > summary.lastActiveDate)) {
        summary.lastActiveDate = day.date;
      }
    });
    
    // Calculate overall average processing time
    if (totalOperations > 0) {
      summary.averageProcessingTime = totalProcessingTimeWeighted / totalOperations;
    }
    
    // Calculate success rate
    const totalOps = summary.totalSuccessfulOperations + summary.totalFailedOperations;
    if (totalOps > 0) {
      summary.successRate = (summary.totalSuccessfulOperations / totalOps) * 100;
    }
    
    return summary;
  },
}); 