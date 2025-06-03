import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import {
  internalAction,
  getRequiredEnvVar,
  formatError,
  safeJsonParse,
  base64ToUint8Array,
} from "./utils";
import { httpAction } from "./_generated/server";

// Define types for the voiceover record
type VoiceoverRecord = {
  _id: Id<"voiceovers">;
  scriptId: Id<"scripts">;
  sceneId?: Id<"storyboard_scenes">;
  userId: string;
  videoId: string;
  storageId?: Id<"_storage">;
  voiceName: string;
  voiceProvider: string;
  duration?: number;
  text: string;
  status?: "processing" | "completed" | "failed";
  errorMessage?: string;
  createdAt: number;
};

// Define type for the debug result
type DebugVoiceoverResult = {
  voiceover: VoiceoverRecord;
  hasStorageId: boolean;
  url: string | null;
  urlError: string | null;
  errorMessage: string | null;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  createdAt: string;
  now: string;
  error?: string;
};

// Debug function to check voiceover details and status
export const debugVoiceover = query({
  args: {
    voiceoverId: v.id("voiceovers"),
  },
  handler: async (
    ctx,
    args
  ): Promise<DebugVoiceoverResult | { error: string }> => {
    // Get the voiceover record
    const voiceover = await ctx.db.get(args.voiceoverId);

    if (!voiceover) {
      return { error: "Voiceover not found" };
    }

    // Check if it has a storageId
    const hasStorageId = !!voiceover.storageId;

    // Try to get the URL if it has a storageId
    let url = null;
    let urlError = null;

    if (hasStorageId) {
      try {
        url = await ctx.storage.getUrl(voiceover.storageId as Id<"_storage">);
        console.log("VIDEO URL", url);
      } catch (error) {
        urlError = formatError(error, "Error getting URL");
      }
    }

    // Return detailed information for debugging
    return {
      voiceover,
      hasStorageId,
      url,
      urlError,
      // Include any existing error messages
      errorMessage: voiceover.errorMessage || null,
      // Check for processing state
      isProcessing: voiceover.status === "processing",
      isCompleted: voiceover.status === "completed",
      isFailed: voiceover.status === "failed",
      // Timestamps for debugging
      createdAt: new Date(voiceover.createdAt).toISOString(),
      now: new Date().toISOString(),
    };
  },
});

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
        url: voiceover.storageId
          ? await ctx.storage.getUrl(voiceover.storageId as Id<"_storage">)
          : null,
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
      url: voiceover.storageId
        ? await ctx.storage.getUrl(voiceover.storageId as Id<"_storage">)
        : null,
    };

    console.log("VOICEOVER WITH URL", voiceoverWithUrl);
    return voiceoverWithUrl;
  },
});

// Get voiceover by ID (for internal use)
export const getVoiceoverById = query({
  args: {
    voiceoverId: v.id("voiceovers"),
  },
  handler: async (ctx, args): Promise<VoiceoverRecord | null> => {
    return await ctx.db.get(args.voiceoverId);
  },
});

// Internal mutation to update voiceover record with storage ID and duration
export const updateVoiceoverWithAudio = mutation({
  args: {
    voiceoverId: v.id("voiceovers"),
    storageId: v.id("_storage"),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceoverId, {
      storageId: args.storageId,
      duration: args.duration,
      status: "completed" as const,
    });

    return { success: true };
  },
});

// Mark voiceover as failed
export const markVoiceoverFailed = mutation({
  args: {
    voiceoverId: v.id("voiceovers"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceoverId, {
      status: "failed" as const,
      errorMessage: args.errorMessage,
    });

    return { success: true };
  },
});

// Initiate voiceover generation process
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
    // First, check if there's already a voiceover for this scene
    // If so, we'll update it later
    let existingVoiceoverId: Id<"voiceovers"> | null = null;

    if (args.sceneId) {
      const existingVoiceover = await ctx.db
        .query("voiceovers")
        .withIndex("by_scene_id", (q) => q.eq("sceneId", args.sceneId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (existingVoiceover) {
        existingVoiceoverId = existingVoiceover._id;
      }
    }

    // Create a placeholder voiceover record with "processing" status
    const voiceoverId =
      existingVoiceoverId ||
      (await ctx.db.insert("voiceovers", {
        scriptId: args.scriptId,
        sceneId: args.sceneId,
        userId: args.userId,
        videoId: args.videoId,
        voiceName: args.voiceName,
        voiceProvider: args.voiceProvider || "ElevenLabs",
        text: args.text,
        status: "processing" as const,
        createdAt: Date.now(),
      }));

    // If this is for a scene, update the scene with the voiceover ID
    if (args.sceneId) {
      await ctx.db.patch(args.sceneId, {
        voiceoverId: voiceoverId,
      });
    }

    // Schedule the actual generation process
    await ctx.scheduler.runAfter(0, internal.voiceover.processVoiceover, {
      voiceoverId,
      text: args.text,
      voiceName: args.voiceName,
    });

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
      // Delete the audio file from storage
      if (voiceover.storageId) {
        await ctx.storage.delete(voiceover.storageId as Id<"_storage">);
      }

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

// Get available voices from ElevenLabs
export const getAvailableVoices = action({
  args: {},
  handler: async (ctx) => {
    try {
      // In a real implementation, you would call the ElevenLabs API
      // to get the list of available voices

      // For now, return some sample voices
      return [
        {
          id: "21m00Tcm4TlvDq8ikWAM",
          name: "Rachel (Female)",
          gender: "female",
          category: "premade",
        },
        {
          id: "AZnzlk1XvdvUeBnXmlld",
          name: "Domi (Female)",
          gender: "female",
          category: "premade",
        },
        {
          id: "EXAVITQu4vr4xnSDxMaL",
          name: "Bella (Female)",
          gender: "female",
          category: "premade",
        },
        {
          id: "ErXwobaYiN019PkySvjV",
          name: "Antoni (Male)",
          gender: "male",
          category: "premade",
        },
        {
          id: "MF3mGyEYCl7XYWbV9V6O",
          name: "Elli (Female)",
          gender: "female",
          category: "premade",
        },
        {
          id: "TxGEqnHWrfWFTfGW9XjX",
          name: "Josh (Male)",
          gender: "male",
          category: "premade",
        },
        {
          id: "VR6AewLTigWG4xSOukaG",
          name: "Arnold (Male)",
          gender: "male",
          category: "premade",
        },
        {
          id: "pNInz6obpgDQGcFmaJgB",
          name: "Adam (Male)",
          gender: "male",
          category: "premade",
        },
        {
          id: "yoZ06aMxZJJ28mfd3POQ",
          name: "Sam (Male)",
          gender: "male",
          category: "premade",
        },
      ];
    } catch (error) {
      console.error("Error fetching voices:", error);
      return [];
    }
  },
});

// Background action to process voiceover using ElevenLabs
export const processVoiceover = internalAction({
  args: {
    voiceoverId: v.id("voiceovers"),
    text: v.string(),
    voiceName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get voiceover record
      const voiceover = await ctx.runQuery(api.voiceover.getVoiceoverById, {
        voiceoverId: args.voiceoverId,
      });

      if (!voiceover) {
        throw new Error(`Voiceover with ID ${args.voiceoverId} not found`);
      }

      // Check if ElevenLabs API key is available
      const apiKey = getRequiredEnvVar("ELEVENLABS_API_KEY");

      // Initialize ElevenLabs for server-side use (or call your n8n workflow)

      // OPTION 1: For direct ElevenLabs integration, uncomment this:
      // ----------------------------------------------------------------
      // Use the ElevenLabs API endpoint directly
      const voiceId = args.voiceName; // This assumes voiceName contains the ElevenLabs voice ID

      try {
        // Call ElevenLabs API
        console.log(`Calling ElevenLabs API for voice ID: ${voiceId}`);
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": apiKey,
            },
            body: JSON.stringify({
              text: args.text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        );

        if (!response.ok) {
          // Try to parse error response
          const errorText = await response.text();
          console.error(`ElevenLabs API error response: ${errorText}`);

          const errorData = safeJsonParse(errorText, {
            detail: { message: response.statusText },
          });
          const errorMessage =
            errorData?.detail?.message || response.statusText;
          throw new Error(
            `ElevenLabs API error: ${errorMessage} (${response.status})`
          );
        }

        console.log(`Successfully received response from ElevenLabs API`);

        // Get the audio data
        const audioArrayBuffer = await response.arrayBuffer();
        if (!audioArrayBuffer || audioArrayBuffer.byteLength === 0) {
          throw new Error("Received empty audio data from ElevenLabs");
        }

        console.log(
          `Received audio data of size: ${audioArrayBuffer.byteLength} bytes`
        );

        // Create a Blob directly from the ArrayBuffer without using Buffer
        const audioBlob = new Blob([new Uint8Array(audioArrayBuffer)], {
          type: "audio/mpeg",
        });
        console.log(
          `Created audio blob of size: ${audioBlob.size} bytes with type: ${audioBlob.type}`
        );

        // Calculate duration (approximate based on character count)
        // In a real implementation, you would get actual duration from audio metadata
        const wordCount = args.text.split(/\s+/).length;
        const estimatedDuration = Math.max(
          1,
          Math.round((wordCount / 150) * 60)
        ); // Assumes 150 words per minute

        // Upload the audio to Convex storage
        console.log(`Uploading audio to Convex storage...`);
        const storageId = await ctx.storage.store(audioBlob);
        console.log(`Audio uploaded to Convex storage with ID: ${storageId}`);

        // Verify we can generate a URL from the storage ID
        try {
          const url = await ctx.storage.getUrl(storageId);
          // Check if URL exists before using it
          if (url) {
            console.log(
              `Successfully generated URL for storage ID: ${url.substring(0, 100)}...`
            );

            // Test the URL to ensure it's accessible
            try {
              const testResponse = await fetch(url, { method: "HEAD" });
              console.log(
                `URL accessibility test: ${testResponse.status} - ${testResponse.statusText}`
              );
              console.log(
                `Content-Type from storage: ${testResponse.headers.get("content-type")}`
              );
            } catch (fetchError) {
              console.error(
                `Error testing URL accessibility: ${formatError(fetchError)}`
              );
            }
          } else {
            console.error("Storage URL is null - this shouldn't happen");
          }
        } catch (urlError) {
          console.error(
            `Error generating URL for storage ID: ${formatError(urlError)}`
          );
          // Continue anyway as we'll update the record
        }

        // Update the voiceover record with the storage ID and duration
        console.log(
          `Updating voiceover record with storage ID and duration...`
        );
        await ctx.runMutation(api.voiceover.updateVoiceoverWithAudio, {
          voiceoverId: args.voiceoverId,
          storageId,
          duration: estimatedDuration,
        });
        console.log(`Successfully updated voiceover record`);

        return { success: true };
      } catch (apiError) {
        console.error("ElevenLabs API error:", apiError);
        throw new Error(formatError(apiError, "Error calling ElevenLabs API"));
      }

      // OPTION 2: For n8n integration, uncomment this:
      // ----------------------------------------------------------------
      // const webhookUrl = getRequiredEnvVar("N8N_VOICEOVER_WEBHOOK_URL");
      // const callbackUrl = getRequiredEnvVar("CALLBACK_URL");
      // const n8nResponse = await fetch(webhookUrl, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     voiceId: args.voiceName,
      //     text: args.text,
      //     voiceoverId: args.voiceoverId,
      //     callbackUrl: `${callbackUrl}/api/convex/voiceover/callback`,
      //   }),
      // });
      //
      // if (!n8nResponse.ok) {
      //   throw new Error(`n8n webhook error: ${n8nResponse.statusText}`);
      // }
      //
      // // For n8n, we'd return early here as the n8n workflow would handle
      // // uploading the file and calling our callback endpoint
      // return { success: true, status: "processing" };
    } catch (error) {
      console.error("Voiceover generation error:", error);

      // Update the voiceover record with error status
      await ctx.runMutation(api.voiceover.markVoiceoverFailed, {
        voiceoverId: args.voiceoverId,
        errorMessage: formatError(error),
      });

      return { success: false, error: formatError(error) };
    }
  },
});

// Define the type for HTTP action handler arguments
type VoiceoverCallbackArgs = {
  voiceoverId: string;
  success: boolean;
  audioBase64?: string;
  duration?: number;
  errorMessage?: string;
};

// Handle callback from n8n or external service
export const handleVoiceoverCallback = httpAction(async (ctx, request) => {
  try {
    const data = (await request.json()) as VoiceoverCallbackArgs;

    if (!data.success) {
      // Handle failure
      await ctx.runMutation(api.voiceover.markVoiceoverFailed, {
        voiceoverId: data.voiceoverId as Id<"voiceovers">,
        errorMessage:
          data.errorMessage || "Unknown error from external service",
      });

      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle success
    if (!data.audioBase64) {
      throw new Error("Missing audio data in callback");
    }

    // Convert base64 to Uint8Array using utility function
    const audioData = base64ToUint8Array(data.audioBase64);
    const audioBlob = new Blob([audioData]);

    // Upload the audio to Convex storage
    const storageId = await ctx.storage.store(audioBlob);

    // Update the voiceover record
    await ctx.runMutation(api.voiceover.updateVoiceoverWithAudio, {
      voiceoverId: data.voiceoverId as Id<"voiceovers">,
      storageId,
      duration: data.duration || 0,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling voiceover callback:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// Utility action to fix voiceovers with missing URLs
export const fixVoiceover = action({
  args: {
    voiceoverId: v.id("voiceovers"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    url?: string;
    voiceover?: VoiceoverRecord;
    debug?: DebugVoiceoverResult;
  }> => {
    try {
      // Get the voiceover record
      const voiceover = await ctx.runQuery(api.voiceover.getVoiceoverById, {
        voiceoverId: args.voiceoverId,
      });

      if (!voiceover) {
        return {
          success: false,
          error: "Voiceover not found",
        };
      }

      // If there's no storageId, can't fix it
      if (!voiceover.storageId) {
        return {
          success: false,
          error: "Voiceover has no storageId, cannot fix",
          voiceover,
        };
      }

      // Try to get the URL to check if it works
      let url: string | null = null;
      try {
        // This will throw if there's an issue with the storage ID
        const testUrl = await ctx.storage.getUrl(voiceover.storageId);
        url = testUrl;
      } catch (error) {
        return {
          success: false,
          error: `Storage ID exists but URL generation failed: ${formatError(error)}`,
          voiceover,
        };
      }

      // If we're here, the URL generation works
      const debug = (await ctx.runQuery(api.voiceover.debugVoiceover, {
        voiceoverId: args.voiceoverId,
      })) as DebugVoiceoverResult;

      return {
        success: true,
        message: "Voiceover URL is working correctly",
        url: url || "", // Ensure URL is never null for TypeScript
        debug,
      };
    } catch (error) {
      return {
        success: false,
        error: formatError(error),
      };
    }
  },
});
