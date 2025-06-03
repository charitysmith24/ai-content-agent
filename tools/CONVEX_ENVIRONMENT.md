# Convex Environment Limitations and Solutions

This document explains the environment limitations in Convex and provides solutions for common issues.

## Environment Limitations

Convex functions run in a restricted JavaScript environment that doesn't have access to many Node.js-specific APIs. Some of the notable limitations include:

- No access to Node.js `Buffer` class
- No access to browser APIs like `atob` and `btoa`
- No access to Node.js filesystem functions
- No access to environment variables outside of `process.env`

## Error: "Buffer is not defined"

### Problem

The error "Buffer is not defined" occurs when trying to use the Node.js `Buffer` class in Convex functions. This commonly happens when:

1. Converting between binary data formats
2. Processing audio/image data
3. Handling base64 encoding/decoding

### Solution

#### For ArrayBuffer to Blob conversion:

Instead of:

```typescript
const audioBuffer = new Blob([Buffer.from(audioArrayBuffer)]);
```

Use:

```typescript
const audioBlob = new Blob([new Uint8Array(audioArrayBuffer)]);
```

#### For base64 decoding:

Instead of:

```typescript
const binaryData = Buffer.from(base64String, "base64");
```

Use a custom implementation:

```typescript
const binaryData = base64ToUint8Array(base64String);
```

## Custom base64 Decoder Implementation

We've added a custom `base64ToUint8Array` function in `convex/utils.ts` that works in the Convex environment:

```typescript
export function base64ToUint8Array(base64: string): Uint8Array {
  // Remove non-base64 characters and padding
  const cleanBase64 = base64.replace(/[^A-Za-z0-9+/]/g, "");

  // Lookup table for base64 characters
  const lookupTable =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const len = cleanBase64.length;
  const paddingLength = (4 - (len % 4)) % 4;
  const outputLength =
    Math.floor(((len + paddingLength) * 3) / 4) - paddingLength;
  const output = new Uint8Array(outputLength);

  let position = 0;

  // Process groups of 4 characters
  for (let i = 0; i < len; i += 4) {
    const b1 = lookupTable.indexOf(cleanBase64.charAt(i));
    const b2 = lookupTable.indexOf(cleanBase64.charAt(i + 1));
    const b3 =
      i + 2 < len ? lookupTable.indexOf(cleanBase64.charAt(i + 2)) : 64;
    const b4 =
      i + 3 < len ? lookupTable.indexOf(cleanBase64.charAt(i + 3)) : 64;

    if (position < outputLength) output[position++] = (b1 << 2) | (b2 >> 4);
    if (position < outputLength)
      output[position++] = ((b2 & 15) << 4) | (b3 >> 2);
    if (position < outputLength) output[position++] = ((b3 & 3) << 6) | b4;
  }

  return output;
}
```

## Best Practices for Binary Data in Convex

1. **Use Uint8Array**: When working with binary data, use `Uint8Array` instead of `Buffer`.

2. **Creating Blobs**: When creating a `Blob` from binary data, wrap it in an array:

   ```typescript
   const blob = new Blob([uint8Array]);
   ```

3. **ArrayBuffer Handling**: Use `new Uint8Array(arrayBuffer)` instead of `Buffer.from(arrayBuffer)`.

4. **Base64 Encoding/Decoding**: Use the `base64ToUint8Array` utility from `convex/utils.ts`.

5. **API Responses**: When getting binary data from APIs:
   ```typescript
   const arrayBuffer = await response.arrayBuffer();
   const blob = new Blob([new Uint8Array(arrayBuffer)]);
   ```

## Common Operations with Binary Data

### Storing Binary Data in Convex

```typescript
const arrayBuffer = await response.arrayBuffer();
const blob = new Blob([new Uint8Array(arrayBuffer)]);
const storageId = await ctx.storage.store(blob);
```

### Base64 to Binary for Storage

```typescript
const uint8Array = base64ToUint8Array(base64String);
const blob = new Blob([uint8Array]);
const storageId = await ctx.storage.store(blob);
```

### Getting URLs for Stored Binary Data

```typescript
const url = await ctx.storage.getUrl(storageId);
```

## Handling Media URLs in Convex

### Problem

When working with audio or other media files in Convex, you may encounter issues with `null` or `undefined` URLs when:

1. A media file is being processed but not yet available
2. The `storageId` field is optional in your schema
3. The URL generation fails for some reason

### Solution

Always validate URLs before using them in media players:

```typescript
// In your Convex query
const getMediaWithUrl = query({
  // ...
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);

    // Return null for URL if storageId doesn't exist
    return {
      ...media,
      url: media.storageId ? await ctx.storage.getUrl(media.storageId) : null,
    };
  }
});

// In your React component
const media = useQuery(api.media.getMediaWithUrl, { id });

// Safe usage in useAudioPlayer or similar hooks
const audioPlayer = useAudioPlayer(
  // Only use the URL if it's a valid string
  media?.url && typeof media.url === 'string' ? media.url : undefined
);

// Safe button enabling
<Button
  onClick={playAudio}
  disabled={!media?.url || typeof media.url !== 'string'}
>
  Play
</Button>
```

## HTML5 Audio in Next.js and SSR

### Problem

Next.js applications use server-side rendering (SSR), which can cause issues when using browser-only APIs like the HTML5 Audio API. Common errors include:

1. `ReferenceError: Audio is not defined` during server rendering
2. Hydration mismatches between server and client
3. Errors when trying to access audio properties like `duration` or `currentTime`

### Solution

To safely use HTML5 Audio in Next.js applications:

1. **Detect client-side rendering:**

```typescript
const isClient = typeof window !== "undefined";
```

2. **Skip audio initialization on server:**

```typescript
// In your useEffect
useEffect(() => {
  // Skip on server
  if (!isClient) return;

  // Audio initialization code here
}, []);
```

3. **Use window.Audio instead of global Audio:**

```typescript
if (isClient) {
  audioRef.current = new window.Audio();
}
```

4. **Safe error handling and null checking:**

```typescript
try {
  if (!audioRef.current) {
    if (isClient) {
      audioRef.current = new window.Audio();
    } else {
      return; // Skip on server
    }
  }

  // Rest of audio code
} catch (error) {
  console.error("Audio error:", error);
  // Handle error gracefully
}
```

5. **Proper play promise handling:**

```typescript
const playPromise = audioElement.play();
if (playPromise !== undefined) {
  playPromise.catch((error) => {
    console.error("Play error:", error);
    // Handle error
  });
}
```

## Environment Variable Handling

When accessing environment variables, use the `getRequiredEnvVar` utility to fail gracefully if a required variable is missing:

```typescript
const apiKey = getRequiredEnvVar("ELEVENLABS_API_KEY");
```
