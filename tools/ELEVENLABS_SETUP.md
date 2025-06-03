# ElevenLabs Voiceover Integration Setup

This document explains how to set up the ElevenLabs integration for generating voiceovers in your application.

## Prerequisites

- An [ElevenLabs](https://elevenlabs.io/) account with API access
- API key from your ElevenLabs account
- (Optional) A self-hosted [n8n](https://n8n.io/) instance for webhook-based processing

## Option 1: Direct ElevenLabs API Integration

### Step 1: Set up environment variables

Add your ElevenLabs API key to your environment variables:

```bash
# .env.local
ELEVENLABS_API_KEY=your-api-key-here
```

### Step 2: Install required dependencies

```bash
npm install @elevenlabs/elevenlabs-js
```

### Step 3: Configure Convex

The implementation already includes the necessary Convex backend code for directly interacting with the ElevenLabs API. Make sure the following code is uncommented in `convex/voiceover.ts`:

```typescript
// OPTION 1: For direct ElevenLabs integration
// Use the ElevenLabs API endpoint directly
const voiceId = args.voiceName;

// Call ElevenLabs API
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
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
```

## Option 2: n8n Integration (for processing intensive workloads)

### Step 1: Set up n8n

1. Install and set up a self-hosted n8n instance
2. Create a new ElevenLabs API key credential in n8n
3. Import the `n8n-voiceover-workflow.json` file from the `tools` directory

### Step 2: Configure environment variables

Add the following environment variables:

```bash
# .env.local
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/elevenlabs-voiceover
CALLBACK_URL=https://your-app-url.com
```

### Step 3: Configure Convex

Comment out Option 1 code and uncomment Option 2 code in `convex/voiceover.ts`:

```typescript
// OPTION 2: For n8n integration
const n8nResponse = await fetch(process.env.N8N_VOICEOVER_WEBHOOK_URL!, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    voiceId: args.voiceName,
    text: args.text,
    voiceoverId: args.voiceoverId,
    callbackUrl: `${process.env.CALLBACK_URL}/api/voiceover/callback`,
  }),
});

if (!n8nResponse.ok) {
  throw new Error(`n8n webhook error: ${n8nResponse.statusText}`);
}

// For n8n, we'd return early here as the n8n workflow would handle
// uploading the file and calling our callback endpoint
return { success: true, status: "processing" };
```

## Voice Selection

The VoiceoverPanel component fetches available voices from ElevenLabs using the `getAvailableVoices` action. In production, this should be modified to fetch the actual voices from your ElevenLabs account.

## Feature Flags

The application uses Schematic for feature flagging. The `VOICEOVER_GENERATION` feature flag controls whether users can access the voiceover functionality based on their subscription tier.

To configure this feature flag:

1. Set up Schematic with the appropriate flag
2. Ensure your subscription tiers have the correct entitlements

## Troubleshooting

### Audio Not Playing

If the audio isn't playing in the browser:

1. Check browser console for errors
2. Verify the Convex storage URL is accessible
3. Make sure the audio format is supported by the browser (MP3 is recommended)

### API Errors

If you encounter ElevenLabs API errors:

1. Verify your API key is valid and has sufficient credits
2. Check API rate limits
3. Verify the voice ID exists in your ElevenLabs account

## Further Customization

You can customize the voiceover generation by:

1. Modifying voice settings (stability, clarity, etc.)
2. Using different ElevenLabs models
3. Implementing voice cloning for custom voices
