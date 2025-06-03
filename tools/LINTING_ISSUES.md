# Linting Issues and Fixes

This document provides information about the linting issues in the ElevenLabs integration and how to fix them.

## Components/storyboard/VoiceoverPanel.tsx

The linting issues in this file were fixed by:

1. Changing the `voices` state management:

   - Added a local state with `useState<ElevenLabsVoice[]>([])`
   - Used `useEffect` to fetch and store voices from the API
   - Updated the component to properly handle this state

2. Fixed type-related issues for voice elements and boolean comparison

## Actions/elevenlabsVoiceover.ts

The linting issues in this file were fixed by:

1. Handling ElevenLabs API type mismatches:
   - Added type assertion for voice objects
   - Added fallbacks for missing properties
   - Fixed property naming (voiceId vs voice_id, previewUrl vs preview_url)

## Convex/voiceover.ts

This file has remaining linting issues related to internal references. These need to be fixed manually:

### Issue: Internal references between Convex functions

The main issue is with internal references between functions using the scheduler and mutation/query functions in Convex. There are two approaches to fix this:

#### Option 1: Use the internal API properly (Recommended)

```typescript
import { internal } from "./_generated/api";

// When scheduling or running internal functions
await ctx.scheduler.runAfter(0, internal.voiceover.processVoiceover, {
  /* args */
});
await ctx.runMutation(internal.voiceover.updateVoiceoverWithAudio, {
  /* args */
});
```

Make sure that the functions being called are properly exported and will be included in the generated internal API.

#### Option 2: Use function names directly (Less type-safe)

If option 1 doesn't work, you can use the function names directly with type assertions:

```typescript
// Cast the string to the appropriate type
await ctx.scheduler.runAfter(0, "voiceover:processVoiceover" as any, {
  /* args */
});
await ctx.runMutation("voiceover:updateVoiceoverWithAudio" as any, {
  /* args */
});
```

### Issue: Buffer vs Blob in Convex functions

When working with binary data in Convex:

```typescript
// Instead of:
const audioBuffer = Buffer.from(audioArrayBuffer);

// Use:
const audioBlob = new Blob([Buffer.from(audioArrayBuffer)]);
```

### Issue: httpAction arguments

For httpAction, use the standard request/response pattern instead of the custom args object:

```typescript
export const handleVoiceoverCallback = httpAction(async (ctx, request) => {
  const data = await request.json();
  // Process data
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
```

## Deployment Note

After fixing these issues, make sure to:

1. Test the voiceover generation end-to-end
2. Verify that the Convex functions are properly deployed
3. Confirm that the feature flag integration works correctly
