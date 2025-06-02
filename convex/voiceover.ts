import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all voiceovers for a given script
export const getVoiceovers = query({
  args: {
    scriptId: v.id("scripts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const voiceovers = await ctx.db
      .query("voiceovers")
      .withIndex("by_script_id", (q) => q.eq("scriptId", args.scriptId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    // Get the URLs for each voiceover
    const voiceoversWithUrls = await Promise.all(
      voiceovers.map(async (voiceover) => ({
        ...voiceover,
        url: await ctx.storage.getUrl(voiceover.storageId),
      }))
    );

    return voiceoversWithUrls;
  },
});

// Get voiceover for a specific scene
export const getSceneVoiceover = query({
  args: {
    sceneId: v.id("storyboard_scenes"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const voiceover = await ctx.db
      .query("voiceovers")
      .withIndex("by_scene_id", (q) => q.eq("sceneId", args.sceneId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!voiceover) {
      return null;
    }
    
    // Get the URL for the voiceover
    const voiceoverWithUrl = {
      ...voiceover,
      url: await ctx.storage.getUrl(voiceover.storageId),
    };

    return voiceoverWithUrl;
  },
});

// Generate voiceover for a script or scene
export const generateVoiceover = mutation({
  args: {
    scriptId: v.id("scripts"),
    sceneId: v.optional(v.id("storyboard_scenes")),
    userId: v.string(),
    videoId: v.string(),
    text: v.string(),
    voiceName: v.string(),
    voiceProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // This is a placeholder for actual ElevenLabs API integration
    // In a real implementation, you would:
    // 1. Call ElevenLabs API to generate voice
    // 2. Upload audio to storage
    // 3. Save voiceover data in database
    
    // Mock storage ID (in real code, this would be generated after uploading to storage)
    const mockStorageId = "mock_storage_id_" + Date.now();
    
    const voiceoverId = await ctx.db.insert("voiceovers", {
      scriptId: args.scriptId,
      sceneId: args.sceneId,
      userId: args.userId,
      videoId: args.videoId,
      // @ts-ignore: Mock storage ID for demo purposes
      storageId: mockStorageId as Id<"_storage">,
      voiceName: args.voiceName,
      voiceProvider: args.voiceProvider || "ElevenLabs",
      text: args.text,
      duration: Math.floor(args.text.length / 20), // Rough estimate: 20 chars per second
      createdAt: Date.now(),
    });
    
    // If this is for a scene, update the scene with the voiceover ID
    if (args.sceneId) {
      await ctx.db.patch(args.sceneId, {
        voiceoverId: voiceoverId,
      });
    }
    
    return { success: true, voiceoverId };
  },
});

// Delete a voiceover
export const deleteVoiceover = mutation({
  args: {
    voiceoverId: v.id("voiceovers"),
  },
  handler: async (ctx, args) => {
    // Get the voiceover to get its storage ID
    const voiceover = await ctx.db.get(args.voiceoverId);
    
    if (voiceover) {
      // Delete the audio file from storage (in a real implementation)
      // await ctx.storage.delete(voiceover.storageId);
      
      // If this voiceover is linked to a scene, update the scene to remove the reference
      if (voiceover.sceneId) {
        await ctx.db.patch(voiceover.sceneId, {
          voiceoverId: undefined,
        });
      }
      
      // Delete the voiceover record
      await ctx.db.delete(args.voiceoverId);
    }
    
    return { success: true };
  },
}); 