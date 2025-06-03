# ElevenLabs Configuration Guide

This document provides detailed configuration instructions for setting up the ElevenLabs voice generation integration.

## Required Environment Variables

Add the following environment variables to your project:

```bash
# .env.local file
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Getting an ElevenLabs API Key

1. Create or log into your account at [ElevenLabs](https://elevenlabs.io/)
2. Navigate to your profile settings
3. Find the API Key section and copy your key
4. If you don't have a key, you may need to generate one

## Setting Up Environment Variables

### For Development

Add the variables to your `.env.local` file at the root of your project:

```bash
# .env.local
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### For Convex

To make the API key available to Convex functions, you need to add it to your Convex environment:

```bash
npx convex env set ELEVENLABS_API_KEY your_elevenlabs_api_key_here
```

## Troubleshooting ElevenLabs API Issues

### Common Error Messages

1. **"ELEVENLABS_API_KEY environment variable is not set"**

   - Ensure you've set the API key in both your local `.env.local` and in the Convex environment

2. **"ElevenLabs API error: Not authorized"**

   - Your API key may be invalid or expired
   - Regenerate your key in the ElevenLabs dashboard

3. **"ElevenLabs API error: Voice not found"**

   - The voice ID you're trying to use doesn't exist or isn't accessible with your account
   - Check that the voice ID is correct
   - Ensure your subscription allows access to the requested voice

4. **"ElevenLabs API error: Too many requests"**
   - You've exceeded your API rate limits
   - Wait and try again, or upgrade your ElevenLabs subscription

### Testing Your ElevenLabs API Key

You can test your ElevenLabs API key with the following curl command:

```bash
curl --request GET \
  --url https://api.elevenlabs.io/v1/voices \
  --header 'accept: application/json' \
  --header 'xi-api-key: YOUR_API_KEY'
```

If successful, you should see a list of available voices.

## Additional Configuration Options

### Voice Settings

You can adjust voice settings in the `processVoiceover` function in `convex/voiceover.ts`:

```typescript
voice_settings: {
  stability: 0.5,        // Range: 0-1. Higher values make voice more consistent
  similarity_boost: 0.75 // Range: 0-1. Higher values make voice more similar to original
}
```

### Model Selection

You can change the model used for voice generation:

```typescript
model_id: "eleven_multilingual_v2"; // Default multilingual model
// Alternatives: "eleven_monolingual_v1", "eleven_turbo_v2"
```

Different models offer various tradeoffs between quality, speed, and cost.

## Rate Limits and Quotas

Be aware that ElevenLabs has rate limits and quotas depending on your subscription plan:

- Free tier: Limited number of characters per month
- Paid tiers: Higher quotas and priority API access

Check your current usage in your ElevenLabs dashboard to avoid unexpected disruptions.
