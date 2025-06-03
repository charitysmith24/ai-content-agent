# Debugging and Fixing Voiceover URL Issues

This document provides guidance on how to diagnose and fix issues with voiceover URLs in the application.

## Understanding the Problem

The issue with the audio player error (`useAudioPlayer.useEffect...`) is related to how voiceovers are stored and retrieved:

1. Voiceovers are stored in the Convex database with a `storageId` field that references the audio file in Convex Storage
2. The URL for the audio file is generated dynamically when querying the voiceover using `ctx.storage.getUrl(storageId)`
3. If `storageId` is missing or invalid, the URL generation fails and causes errors in the audio player

## TypeScript and URL Handling

To avoid TypeScript errors and runtime issues, the codebase now handles URLs with proper typing:

1. The `url` property returned by the query functions may be `null`
2. Before using a URL, it should be checked for both existence and string type:
   ```typescript
   if (url && typeof url === "string") {
     // Safe to use url here
   }
   ```
3. We added proper type definitions for voiceover records and debug results to ensure consistent handling

## Debugging Steps

### Step 1: Check Voiceover Records in the Database

Use the Convex dashboard to view voiceover records and look for these key fields:

- `storageId`: Should be a valid Convex storage ID if processing is complete
- `status`: Should be "completed" if the voiceover generation succeeded
- `errorMessage`: May contain error details if processing failed

### Step 2: Use the Debug Function

We've added a debug function to help investigate voiceover issues. Run this in the Convex dashboard:

```javascript
// Replace VOICEOVER_ID with the actual ID
await ctx.runQuery(api.voiceover.debugVoiceover, {
  voiceoverId: "VOICEOVER_ID",
});
```

This will return detailed information about the voiceover, including:

- Whether it has a valid `storageId`
- If a URL can be generated from the `storageId`
- The processing status and any error messages

### Step 3: Fix Individual Voiceovers

If you've identified a specific voiceover with issues, you can attempt to fix it using:

```javascript
// Replace VOICEOVER_ID with the actual ID
await ctx.runAction(api.voiceover.fixVoiceover, {
  voiceoverId: "VOICEOVER_ID",
});
```

## Common Issues and Solutions

### 1. Missing storageId

**Problem**: Voiceovers without a `storageId` cannot play audio.

**Solution**: These voiceovers need to be regenerated:

```javascript
// Get voiceover details
const voiceover = await ctx.runQuery(api.voiceover.getVoiceoverById, {
  voiceoverId: "VOICEOVER_ID",
});

// Regenerate the voiceover
if (voiceover) {
  await ctx.runMutation(api.voiceover.generateVoiceover, {
    scriptId: voiceover.scriptId,
    sceneId: voiceover.sceneId,
    userId: voiceover.userId,
    videoId: voiceover.videoId,
    text: voiceover.text,
    voiceName: voiceover.voiceName,
    voiceProvider: voiceover.voiceProvider,
  });
}
```

### 2. URL Generation Failures

**Problem**: Even with a valid `storageId`, URL generation might fail.

**Solution**: This is usually due to a permission issue or expired storage link:

```javascript
// Verify storage permissions and URL generation
const storage = await ctx.runQuery(api.storage.getStorageInfo, {
  storageId: "STORAGE_ID",
});

// If storage exists but URL generation fails, the storage permissions may need to be updated
```

### 3. Audio Format Issues

**Problem**: The audio file is stored but has an unsupported format or is corrupted.

**Solution**: Re-process the voiceover with proper error handling:

```javascript
await ctx.runAction(api.voiceover.reprocessVoiceover, {
  voiceoverId: "VOICEOVER_ID",
});
```

## Client-Side Handling

In the React components, ensure proper handling of potentially missing URLs:

```typescript
// Only use the audio player if we have a valid URL
const audioPlayer = useAudioPlayer(
  voiceover?.url && typeof voiceover.url === "string"
    ? voiceover.url
    : undefined
);

// Disable audio controls if URL is missing
<Button
  onClick={playAudio}
  disabled={!voiceover?.url || typeof voiceover.url !== "string"}
>
  Play
</Button>
```

## Prevention

To prevent these issues in the future:

1. Always check for `storageId` existence before attempting to generate URLs
2. Implement proper error handling in the audio player component
3. Use server-side debugging to identify and fix issues early
4. Ensure proper cleanup of failed voiceovers with clear error messages
5. Use TypeScript to enforce type safety when handling URLs
