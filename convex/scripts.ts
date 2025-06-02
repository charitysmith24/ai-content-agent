import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getScripts = query({
  args: {
    videoId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const scripts = await ctx.db
      .query("scripts")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .order("desc")
      .collect();

    return scripts;
  },
});

export const getScriptById = query({
  args: {
    scriptId: v.id("scripts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    
    if (!script) {
      return null;
    }
    
    // Check authorization
    if (script.userId !== args.userId) {
      throw new Error("Unauthorized access to script");
    }
    
    return script;
  },
});

export const generate = mutation({
  args: {
    videoId: v.string(),
    userId: v.string(),
    script: v.string(),
    scriptTitle: v.string(),
    videoTitle: v.optional(v.string()),
    generatedTitle: v.optional(v.string()),
    titleSource: v.union(
      v.literal("original_video"),
      v.literal("ai_generated"), 
      v.literal("user_defined"),
      v.literal("auto_generated")
    ),
    scriptType: v.optional(v.union(
      v.literal("tutorial"),
      v.literal("marketing"),
      v.literal("entertainment"),
      v.literal("educational"),
      v.literal("general")
    )),
  },
  handler: async (ctx, args) => {
    // Store the generated script with enhanced metadata
    const scriptId = await ctx.db.insert("scripts", {
      videoId: args.videoId,
      userId: args.userId,
      script: args.script,
      scriptTitle: args.scriptTitle,
      videoTitle: args.videoTitle,
      generatedTitle: args.generatedTitle,
      titleSource: args.titleSource,
      scriptType: args.scriptType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return scriptId;
  },
});

export const updateScript = mutation({
  args: {
    scriptId: v.id("scripts"),
    script: v.optional(v.string()),
    scriptTitle: v.optional(v.string()),
    videoTitle: v.optional(v.string()),
    generatedTitle: v.optional(v.string()),
    titleSource: v.optional(v.union(
      v.literal("original_video"),
      v.literal("ai_generated"), 
      v.literal("user_defined"),
      v.literal("auto_generated")
    )),
    scriptType: v.optional(v.union(
      v.literal("tutorial"),
      v.literal("marketing"),
      v.literal("entertainment"),
      v.literal("educational"),
      v.literal("general")
    )),
  },
  handler: async (ctx, args) => {
    const { scriptId, ...updateData } = args;
    
    // Get the existing script
    const existingScript = await ctx.db.get(scriptId);
    if (!existingScript) {
      throw new Error("Script not found");
    }
    
    // Only update fields that were provided
    const updates: Record<string, any> = Object.entries(updateData)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // Always update the updatedAt timestamp
    updates.updatedAt = Date.now();
    
    // Apply the updates
    await ctx.db.patch(scriptId, updates);

    return scriptId;
  },
});

export const deleteScript = mutation({
  args: {
    scriptId: v.id("scripts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scriptId);
  },
}); 