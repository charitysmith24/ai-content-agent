import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { kv } from "@vercel/kv";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Define a temporary directory for storing audio files
const TMP_DIR = join(process.cwd(), "tmp");

// Ensure tmp directory exists
if (!existsSync(TMP_DIR)) {
  mkdirSync(TMP_DIR, { recursive: true });
}

// Type for ElevenLabs voice
export type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  gender?: string;
};

// Cache voices for 1 hour to avoid too many API calls
const VOICES_CACHE_KEY = "elevenlabs:voices";
const VOICES_CACHE_TTL = 60 * 60; // 1 hour

/**
 * Get all available voices from ElevenLabs
 */
export async function getVoices(): Promise<ElevenLabsVoice[]> {
  // Try to get from cache first
  const cachedVoices = await kv.get<ElevenLabsVoice[]>(VOICES_CACHE_KEY);

  if (cachedVoices) {
    return cachedVoices;
  }

  try {
    // Fetch voices from ElevenLabs API
    const response = await elevenlabs.voices.getAll();

    // Transform to our voice format
    const voices = response.voices.map((voice: any) => ({
      voice_id: voice.voiceId || voice.voice_id,
      name: voice.name || "",
      category: voice.category || "custom",
      description: voice.description,
      labels: voice.labels,
      preview_url: voice.previewUrl || voice.preview_url,
      gender: voice.labels?.gender,
    }));

    // Cache the voices
    await kv.set(VOICES_CACHE_KEY, voices, { ex: VOICES_CACHE_TTL });

    return voices;
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    return [];
  }
}

/**
 * Generate a voiceover using ElevenLabs API
 * @param voiceId ElevenLabs voice ID
 * @param text Text to convert to speech
 * @param modelId Optional model ID (default: multilingual v2)
 * @returns Object with file path and audio duration
 */
export async function generateVoiceover(
  voiceId: string,
  text: string,
  modelId: string = "eleven_multilingual_v2"
): Promise<{ filePath: string; duration: number }> {
  try {
    // Generate a unique filename
    const filename = `${randomUUID()}.mp3`;
    const outputPath = join(TMP_DIR, filename);

    // Generate the audio using ElevenLabs API
    const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
      text,
      modelId,
      outputFormat: "mp3_44100_128",
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Write to file
    await writeFile(outputPath, buffer);

    // Calculate approximate duration (assuming 150 words per minute)
    // This is a rough estimate - in a production environment,
    // you would use a proper audio analysis library
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    return {
      filePath: outputPath,
      duration: Math.max(1, Math.round(estimatedDuration)),
    };
  } catch (error) {
    console.error("Error generating voiceover:", error);
    throw new Error(
      `Failed to generate voiceover: ${(error as Error).message}`
    );
  }
}

/**
 * Alternative implementation that sends the request to n8n
 * for processing (if you prefer that approach)
 */
export async function generateVoiceoverViaN8n(
  voiceId: string,
  text: string,
  modelId: string = "eleven_multilingual_v2"
): Promise<{ jobId: string }> {
  try {
    // Send request to n8n webhook
    const response = await fetch(process.env.N8N_WEBHOOK_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voiceId,
        text,
        modelId,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voiceover/callback`,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status: ${response.status}`);
    }

    const data = await response.json();
    return { jobId: data.jobId };
  } catch (error) {
    console.error("Error sending request to n8n:", error);
    throw new Error(
      `Failed to send voiceover job to n8n: ${(error as Error).message}`
    );
  }
}
