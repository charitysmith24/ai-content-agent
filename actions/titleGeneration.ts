"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flags";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";

const convexClient = getConvexClient();

// Enhanced system prompt optimized for GPT-4.1 Nano
const ENHANCED_SYSTEM_PROMPT = `You are an expert YouTube SEO title generator. Your specialty is creating viral, clickable titles that rank high in search results.

REQUIREMENTS:
- Generate exactly ONE title
- 40-70 characters (optimal YouTube length)
- Include primary keyword in first 5 words
- Use power words: Ultimate, Secret, Proven, Easy, Complete, Best
- Apply psychological triggers: numbers, questions, urgency
- Must be accurate to content (no clickbait)

SEO OPTIMIZATION:
1. Front-load the most important keyword
2. Include emotional hooks or numbers when relevant
3. Target search intent and user queries
4. Use parentheses for bonus info: (2024), (UPDATED), (EASY)

OUTPUT: Return ONLY the title text, nothing else.`;

// Helper function to analyze video content and extract keywords
function analyzeVideoContent(videoSummary: string, considerations: string) {
  const content = `${videoSummary} ${considerations}`.toLowerCase();

  // Extract potential keywords (simple approach)
  const commonKeywords = [
    "how to",
    "tutorial",
    "guide",
    "tips",
    "tricks",
    "best",
    "top",
    "review",
    "vs",
    "comparison",
    "explained",
    "beginner",
    "advanced",
    "complete",
    "ultimate",
    "secret",
    "proven",
    "easy",
    "fast",
  ];

  const foundKeywords = commonKeywords.filter((keyword) =>
    content.includes(keyword)
  );

  // Extract numbers for potential listicle format
  const numbers = content.match(/\b(\d+)\b/g);

  return {
    keywords: foundKeywords,
    numbers: numbers ? numbers.slice(0, 3) : [], // First 3 numbers found
    hasQuestion: content.includes("?"),
    contentLength: content.length,
  };
}

// Enhanced user prompt generator
function createEnhancedUserPrompt(
  videoSummary: string,
  considerations: string,
  analysis: ReturnType<typeof analyzeVideoContent>
) {
  let prompt = `Generate ONE SEO-optimized YouTube title for this content:

CONTENT SUMMARY:
${videoSummary}

ADDITIONAL CONTEXT:
${considerations}

CONTENT ANALYSIS:
- Detected keywords: ${analysis.keywords.join(", ") || "None detected"}
- Numbers found: ${analysis.numbers.join(", ") || "None"}
- Content type: ${analysis.hasQuestion ? "Q&A/Educational" : "Instructional/Informative"}

TITLE GUIDELINES:
- Make it compelling and click-worthy
- Ensure it accurately represents the content
- Use power words and emotional triggers
- Include main topic within first 5 words
- Target people searching for this type of content

Generate the perfect title that would make someone instantly click:`;

  return prompt;
}

// Validation function for generated titles
function validateTitle(title: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (title.length < 30) {
    issues.push("Title too short (under 30 characters)");
  }
  if (title.length > 80) {
    issues.push("Title too long (over 80 characters)");
  }
  if (title.includes("\n")) {
    issues.push("Title contains line breaks");
  }
  if (title.toLowerCase().includes("clickbait")) {
    issues.push("Contains 'clickbait' term");
  }

  // Check for obvious AI-generated patterns to avoid
  const badPatterns = [
    "here is",
    "here's",
    "this video",
    "in this video",
    "welcome to",
    "today we",
    "i will show",
  ];

  const hasBadPattern = badPatterns.some((pattern) =>
    title.toLowerCase().includes(pattern)
  );

  if (hasBadPattern) {
    issues.push("Contains generic AI patterns");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export async function titleGeneration(
  videoId: string,
  videoSummary: string,
  considerations: string
) {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("User not found");
  }

  // Input validation
  if (!videoSummary?.trim()) {
    throw new Error("Video summary is required");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    console.log("🎯 Video summary:", videoSummary);
    console.log("🎯 Generating title for video for videoId:", videoId);
    console.log("🎯 Considerations:", considerations);

    // Analyze content for better prompt engineering
    const contentAnalysis = analyzeVideoContent(videoSummary, considerations);
    console.log("🎯 Content analysis:", contentAnalysis);

    // Create enhanced prompt
    const userPrompt = createEnhancedUserPrompt(
      videoSummary,
      considerations,
      contentAnalysis
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano-2025-04-14", // Use specific model version
      messages: [
        {
          role: "system",
          content: ENHANCED_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7, // Good balance for creativity
      max_tokens: 100, // Reduced since we only need one title
      top_p: 0.9, // Good token diversity
      presence_penalty: 0.1, // Slight penalty for repetition
      frequency_penalty: 0.1, // Slight penalty for frequency
    });

    let title = response.choices[0]?.message?.content?.trim() || "";

    if (!title) {
      throw new Error("No title generated in response");
    }

    // Clean up common AI response patterns
    title = title
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/^\d+\.\s*/, "") // Remove numbering (1. )
      .replace(/^Title:\s*/i, "") // Remove "Title:" prefix
      .trim();

    // Validate the generated title
    const validation = validateTitle(title);

    if (!validation.isValid) {
      console.warn("⚠️ Title validation issues:", validation.issues);

      // Try to fix common issues
      if (title.length > 80) {
        title = title.substring(0, 77) + "...";
      }
    }

    // Final length check
    if (title.length > 100) {
      title = title.substring(0, 97) + "...";
    }

    console.log("🎯 Generated title:", title);
    console.log("🎯 Title length:", title.length);

    // Save to database
    await convexClient.mutation(api.titles.generate, {
      videoId,
      userId: user.id,
      title: title,
    });

    // Track analytics
    await client.track({
      event: featureFlagEvents[FeatureFlag.TITLE_GENERATION].event,
      company: {
        id: user.id,
      },
      user: {
        id: user.id,
      },
    });

    console.log("🎯 Title generated successfully:", title);
    return {
      title,
      metadata: {
        length: title.length,
        analysis: contentAnalysis,
        validation: validation,
      },
    };
  } catch (error) {
    console.error("❌ Error generating title:", error);

    // Enhanced error handling with fallbacks
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (error.message.includes("API key")) {
        throw new Error("API configuration error. Please contact support.");
      } else if (error.message.includes("model")) {
        throw new Error("Model unavailable. Please try again later.");
      }
    }

    throw new Error("Failed to generate title. Please try again.");
  }
}

// Alternative function for generating multiple title options
export async function generateMultipleTitles(
  videoId: string,
  videoSummary: string,
  considerations: string,
  count: number = 3
) {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("User not found");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const contentAnalysis = analyzeVideoContent(videoSummary, considerations);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        {
          role: "system",
          content: `${ENHANCED_SYSTEM_PROMPT}

OUTPUT FORMAT: Return exactly ${count} titles, each on a new line, numbered 1-${count}.`,
        },
        {
          role: "user",
          content: createEnhancedUserPrompt(
            videoSummary,
            considerations,
            contentAnalysis
          ),
        },
      ],
      temperature: 0.8, // Higher creativity for multiple options
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";
    const titles = content
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((title) => title.length > 0)
      .slice(0, count);

    return {
      titles,
      metadata: {
        analysis: contentAnalysis,
        count: titles.length,
      },
    };
  } catch (error) {
    console.error("❌ Error generating multiple titles:", error);
    throw new Error("Failed to generate multiple titles");
  }
}
