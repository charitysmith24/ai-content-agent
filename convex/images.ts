import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getImages = query({
  args: {
    userId: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("images")
      .withIndex("by_user_and_video")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("videoId"), args.videoId))
      .collect();

    const imageUrls = await Promise.all(
      images.map(async (image) => ({
        ...image,
        url: await ctx.storage.getUrl(image.storageId),
      }))
    );

    return imageUrls;
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Store a new image URL for a video
export const storeImage = mutation({
  args: {
    storageId: v.id("_storage"),
    videoId: v.string(),
    userId: v.string(),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    imageType: v.optional(v.union(
      v.literal("thumbnail"),
      v.literal("cover"),
      v.literal("social_media"),
      v.literal("custom")
    )),
    dimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
    style: v.optional(v.string()),
    quality: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store the image URL in the database
    const imageId = await ctx.db.insert("images", {
      storageId: args.storageId,
      videoId: args.videoId,
      userId: args.userId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      imageType: args.imageType,
      dimensions: args.dimensions,
      prompt: args.prompt,
      model: args.model,
      style: args.style,
      quality: args.quality,
      generatedAt: Date.now(),
      isActive: true,
      downloadCount: 0,
    });

    return imageId;
  },
});

// Get images for a specific user and video combination
export const getImage = query({
  args: {
    userId: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db
      .query("images")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", args.userId).eq("videoId", args.videoId)
      )
      .first();

    if (!image) {
      return null;
    }

    return await ctx.storage.getUrl(image.storageId);
  },
});

// New function to update image metadata
export const updateImageMetadata = mutation({
  args: {
    imageId: v.id("images"),
    isActive: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { imageId, ...updateData } = args;
    
    // Only update fields that were provided
    const updates: Record<string, any> = Object.entries(updateData)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // Update download count if image is being marked as active
    if (updates.isActive === true) {
      // If setting to active, mark all other images for this video as inactive
      const image = await ctx.db.get(imageId);
      if (image) {
        const otherImages = await ctx.db
          .query("images")
          .withIndex("by_user_and_video", q => 
            q.eq("userId", image.userId).eq("videoId", image.videoId)
          )
          .filter(q => q.neq(q.field("_id"), imageId))
          .collect();
        
        for (const otherImage of otherImages) {
          await ctx.db.patch(otherImage._id, { isActive: false });
        }
      }
    }
    
    // Apply the updates
    await ctx.db.patch(imageId, updates);
    
    return imageId;
  },
});

// New function to increment download count
export const incrementDownloadCount = mutation({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }
    
    const currentCount = image.downloadCount || 0;
    await ctx.db.patch(args.imageId, {
      downloadCount: currentCount + 1,
    });
    
    return args.imageId;
  },
});
