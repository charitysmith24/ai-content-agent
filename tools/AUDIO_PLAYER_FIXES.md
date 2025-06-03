# Audio Player Bug Fixes

## Issue

An error occurred in the `useAudioPlayer` hook at lines 49-50 when trying to play voiceover audio:

```
useAudioPlayer.useEffect@http://localhost:3000/_next/static/chunks/_61932142._.js?id=%255Bproject%255D%252Fcomponents%252Fhooks%252FuseAudioPlayer.ts+%255Bapp-client%255D+%2528ecmascript%2529:50:13
```

## Root Cause

The error occurred because:

1. The `useAudioPlayer` hook was trying to use a URL that might be `null` or not a string
2. In the Convex schema, `storageId` in the `voiceovers` table is optional, which means that when a voiceover is initially created, it may not have a `storageId` until processing completes
3. The audio player was trying to set `audio.src` with a potentially invalid URL
4. The `Audio` constructor was called without checking if it's available in the current environment
5. Next.js server-side rendering was causing issues with audio initialization

## Fixes Made

### 1. SSR Compatibility

Added checks to prevent audio-related code from running during server-side rendering:

```typescript
// Check if code is running on the client side
const isClient = typeof window !== "undefined";

// Skip audio initialization on the server
if (!isClient) return;

// Use window.Audio for safer client-side initialization
audioRef.current = new window.Audio();
```

### 2. Updated VoiceoverPanel Component

Added type checking for the URL before passing to useAudioPlayer:

```typescript
useAudioPlayer(
  // Only pass a valid URL string or undefined
  voiceover?.url && typeof voiceover.url === "string"
    ? voiceover.url
    : undefined,
  () => {
    // No special handling needed for onEnded
  }
);
```

Also updated the play button's disabled state to check for valid URL:

```typescript
disabled={!voiceover.url || typeof voiceover.url !== 'string' || audioError !== null}
```

### 3. Enhanced useAudioPlayer Hook

Added additional type checking and error handling in the useEffect and togglePlayback functions:

```typescript
// In useEffect
if (!isClient || !url || typeof url !== "string") return;

// Early return if we couldn't create an audio element
if (!audioRef.current) {
  throw new Error("Failed to create audio element");
}

// Check if Audio API is available
audioRef.current = new window.Audio();

// In togglePlayback
if (!isClient || !audioRef.current || !url || typeof url !== "string") return;
```

### 4. Improved Play Promise Handling

Added better handling of the audio.play() promise to avoid uncaught promise rejections:

```typescript
const playPromise = audio.play();
if (playPromise !== undefined) {
  playPromise.catch((error) => {
    console.error("Error playing audio:", error);
    setState((prev) => ({ ...prev, error }));
  });
}
```

### 5. Added Error Handling

Wrapped audio creation in try/catch blocks to prevent uncaught exceptions:

```typescript
try {
  // Audio creation and setup
} catch (error) {
  console.error("Error initializing audio element:", error);
  setState((prev) => ({
    ...prev,
    error:
      error instanceof Error
        ? error
        : new Error("Failed to initialize audio player"),
  }));
  return undefined;
}
```

### 6. Documentation Updates

Added new sections to `CONVEX_ENVIRONMENT.md` about properly handling media URLs in Convex and SSR-compatibility with HTML5 audio.

## Testing

To verify the fix:

1. Generate a new voiceover for a scene
2. Wait for processing to complete
3. Try playing the audio - it should now work without errors

If the audio fails to play, the error handling now properly prevents runtime errors and displays a user-friendly error message.

## Browser Compatibility

The updated implementation now safely handles environments where the Audio API might not be available or behave differently:

- Detects server-side rendering and skips audio initialization
- Uses window.Audio for safer client-side initialization
- Validates the audio element after creation
- Provides meaningful error messages for debugging
- Properly handles the play() promise to avoid uncaught rejections
