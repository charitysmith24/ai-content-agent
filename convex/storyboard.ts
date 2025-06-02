import { v } from "convex/values";
import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Get all scenes for a given script
export const getScenes = query({
  args: {
    scriptId: v.id("scripts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const scenes = await ctx.db
      .query("storyboard_scenes")
      .withIndex("by_script_id", (q) => q.eq("scriptId", args.scriptId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("asc")
      .collect();

    return scenes;
  },
});

// Parse a script into scenes using AI
export const parseScriptIntoScenes = mutation({
  args: {
    scriptId: v.id("scripts"),
    userId: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the script
    const script = await ctx.db.get(args.scriptId);
    
    if (!script) {
      throw new Error("Script not found");
    }
    
    if (script.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    
    // Call the AI function to parse the script
    const scenesParsed = await ctx.scheduler.runAfter(0, internal.storyboard.parseScriptWithAI, {
      scriptId: args.scriptId,
      scriptContent: script.script,
      userId: args.userId,
      videoId: args.videoId,
    });
    
    return { success: true };
  },
});

// Internal mutation to create a scene
export const createSceneInternal = internalMutation({
  args: {
    scriptId: v.id("scripts"),
    userId: v.string(),
    videoId: v.string(),
    sceneIndex: v.number(),
    sceneContent: v.string(),
    sceneName: v.string(),
    contentType: v.union(
      v.literal("intro"),
      v.literal("action"),
      v.literal("dialogue"),
      v.literal("transition"),
      v.literal("outro"),
      v.literal("other")
    ),
    emotion: v.optional(v.string()),
    visualElements: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sceneId = await ctx.db.insert("storyboard_scenes", {
      scriptId: args.scriptId,
      userId: args.userId,
      videoId: args.videoId,
      sceneIndex: args.sceneIndex,
      sceneContent: args.sceneContent,
      sceneName: args.sceneName,
      contentType: args.contentType,
      emotion: args.emotion,
      visualElements: args.visualElements,
      notes: args.notes,
      duration: args.duration,
      createdAt: Date.now(),
    });
    
    return sceneId;
  },
});

// Internal AI parsing function
export const parseScriptWithAI = internalAction({
  args: {
    scriptId: v.id("scripts"),
    scriptContent: v.string(),
    userId: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    // This is where we'd integrate with an AI service to parse the script
    // For now, let's create a basic scene structure
    
    // Simple split by paragraphs with some basic heuristics
    const paragraphs = args.scriptContent.split(/\n\s*\n/);
    
    // Create scenes from paragraphs (simplified for now)
    let sceneIndex = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph.length < 10) continue; // Skip very short paragraphs
      
      // Simple content type detection based on keywords
      let contentType = "other";
      if (i === 0) contentType = "intro";
      else if (i === paragraphs.length - 1) contentType = "outro";
      else if (paragraph.includes("says") || paragraph.includes("said") || paragraph.includes(":")) {
        contentType = "dialogue";
      } else if (paragraph.startsWith("Then") || paragraph.includes("Next") || paragraph.includes("After")) {
        contentType = "transition";
      } else {
        contentType = "action";
      }
      
      // Simple emotion detection (very basic)
      let emotion = undefined;
      if (paragraph.toLowerCase().includes("happy") || paragraph.toLowerCase().includes("excited")) {
        emotion = "happy";
      } else if (paragraph.toLowerCase().includes("sad") || paragraph.toLowerCase().includes("upset")) {
        emotion = "sad";
      } else if (paragraph.toLowerCase().includes("serious") || paragraph.toLowerCase().includes("professional")) {
        emotion = "serious";
      }
      
      // Simple visual elements extraction (keywords)
      const visualKeywords = ["shows", "displays", "screen", "image", "picture", "view", "camera"];
      const visualElements = visualKeywords
        .filter(keyword => paragraph.toLowerCase().includes(keyword))
        .map(keyword => {
          // Extract a few words around the keyword for context
          const index = paragraph.toLowerCase().indexOf(keyword);
          const start = Math.max(0, index - 20);
          const end = Math.min(paragraph.length, index + 20);
          return paragraph.substring(start, end);
        });
      
      // Create a scene with metadata using internal mutation
      await ctx.runMutation(internal.storyboard.createSceneInternal, {
        scriptId: args.scriptId,
        userId: args.userId,
        videoId: args.videoId,
        sceneIndex: sceneIndex++,
        sceneContent: paragraph,
        sceneName: `Scene ${sceneIndex}`,
        contentType: contentType as any,
        emotion: emotion,
        visualElements: visualElements.length > 0 ? visualElements : undefined,
        notes: undefined,
        duration: Math.floor(paragraph.length / 20), // Rough estimate: 20 chars per second
      });
    }
    
    return { success: true, sceneCount: sceneIndex };
  },
});

// Create a single scene (public mutation)
export const createScene = mutation({
  args: {
    scriptId: v.id("scripts"),
    userId: v.string(),
    videoId: v.string(),
    sceneIndex: v.number(),
    sceneContent: v.string(),
    sceneName: v.string(),
    contentType: v.union(
      v.literal("intro"),
      v.literal("action"),
      v.literal("dialogue"),
      v.literal("transition"),
      v.literal("outro"),
      v.literal("other")
    ),
    emotion: v.optional(v.string()),
    visualElements: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sceneId = await ctx.db.insert("storyboard_scenes", {
      scriptId: args.scriptId,
      userId: args.userId,
      videoId: args.videoId,
      sceneIndex: args.sceneIndex,
      sceneContent: args.sceneContent,
      sceneName: args.sceneName,
      contentType: args.contentType,
      emotion: args.emotion,
      visualElements: args.visualElements,
      notes: args.notes,
      duration: args.duration,
      createdAt: Date.now(),
    });
    
    return sceneId;
  },
});

// Update a scene
export const updateScene = mutation({
  args: {
    sceneId: v.id("storyboard_scenes"),
    sceneContent: v.optional(v.string()),
    sceneName: v.optional(v.string()),
    contentType: v.optional(v.union(
      v.literal("intro"),
      v.literal("action"),
      v.literal("dialogue"),
      v.literal("transition"),
      v.literal("outro"),
      v.literal("other")
    )),
    emotion: v.optional(v.string()),
    visualElements: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    duration: v.optional(v.number()),
    voiceoverId: v.optional(v.id("voiceovers")),
  },
  handler: async (ctx, args) => {
    // Remove the sceneId from the update object
    const { sceneId, ...updateData } = args;
    
    // Apply the update
    await ctx.db.patch(sceneId, updateData);
    
    return sceneId;
  },
});

// Delete a scene
export const deleteScene = mutation({
  args: {
    sceneId: v.id("storyboard_scenes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sceneId);
  },
});

// Generate an image for a scene
export const generateSceneImage = mutation({
  args: {
    sceneId: v.id("storyboard_scenes"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const scene = await ctx.db.get(args.sceneId);
    
    if (!scene) {
      throw new Error("Scene not found");
    }
    
    if (scene.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    
    // This would be where you'd call an image generation API
    // For now, we'll just log that we'd generate an image
    console.log(`Would generate image for scene: ${scene.sceneName}`);
    
    // In a real implementation, you would:
    // 1. Call an image generation API
    // 2. Upload the image to storage
    // 3. Update the scene with the storage ID
    
    return { success: true };
  },
}); 