import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get chat history for a user
export const getChatHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10; // Default to 10 chat sessions
    
    const sessions = await ctx.db
      .query("chatHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    return sessions;
  },
});

// Get chat history for a specific video
export const getVideoChatHistory = query({
  args: {
    userId: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatHistory")
      .withIndex("by_user_and_video", (q) => 
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .order("desc")
      .collect();
    
    return sessions;
  },
});

// Get a specific chat session
export const getChatSession = query({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatHistory")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    return session;
  },
});

// Create a new chat session
export const createChatSession = mutation({
  args: {
    userId: v.string(),
    videoId: v.optional(v.string()),
    initialMessage: v.string(),
    context: v.optional(v.object({
      videoTitle: v.optional(v.string()),
      analysisData: v.optional(v.any()),
      userPreferences: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionId = `chat_${args.userId}_${now}`;
    
    const chatId = await ctx.db.insert("chatHistory", {
      userId: args.userId,
      videoId: args.videoId,
      sessionId,
      messages: [
        {
          id: `msg_${now}`,
          role: "user",
          content: args.initialMessage,
          timestamp: now,
        }
      ],
      startedAt: now,
      lastMessageAt: now,
      isActive: true,
      context: args.context,
      totalMessages: 1,
      totalTokens: 0, // Will be updated when assistant responds
    });
    
    return {
      chatId,
      sessionId,
    };
  },
});

// Add a message to an existing chat session
export const addMessage = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
    message: v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      toolCalls: v.optional(v.array(v.object({
        toolName: v.string(),
        parameters: v.optional(v.any()),
        result: v.optional(v.any()),
        executionTime: v.optional(v.number()),
      }))),
      model: v.optional(v.string()),
      tokens: v.optional(v.object({
        input: v.number(),
        output: v.number(),
        total: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // Find the chat session
    const session = await ctx.db
      .query("chatHistory")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!session) {
      throw new Error("Chat session not found");
    }
    
    const now = Date.now();
    const messageId = `msg_${now}`;
    
    // Add the new message
    const newMessages = [
      ...session.messages,
      {
        id: messageId,
        ...args.message,
        timestamp: now,
      }
    ];
    
    // Calculate total tokens
    let totalTokens = session.totalTokens || 0;
    if (args.message.tokens) {
      totalTokens += args.message.tokens.total;
    }
    
    // Calculate average response time (for assistant messages)
    let averageResponseTime = session.averageResponseTime;
    if (args.message.role === "assistant" && session.messages.length > 0) {
      const lastUserMessage = [...session.messages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        const responseTime = now - lastUserMessage.timestamp;
        
        if (averageResponseTime === undefined) {
          averageResponseTime = responseTime;
        } else {
          // Simple moving average
          averageResponseTime = (averageResponseTime + responseTime) / 2;
        }
      }
    }
    
    // Update the chat session
    await ctx.db.patch(session._id, {
      messages: newMessages,
      lastMessageAt: now,
      totalMessages: newMessages.length,
      totalTokens,
      averageResponseTime,
    });
    
    return {
      success: true,
      messageId,
    };
  },
});

// Mark a chat session as inactive
export const markSessionInactive = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatHistory")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!session) {
      throw new Error("Chat session not found");
    }
    
    await ctx.db.patch(session._id, {
      isActive: false,
    });
    
    return { success: true };
  },
});

// Delete a chat session
export const deleteChatSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatHistory")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!session) {
      throw new Error("Chat session not found");
    }
    
    await ctx.db.delete(session._id);
    
    return { success: true };
  },
}); 