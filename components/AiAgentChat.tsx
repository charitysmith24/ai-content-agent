"use client";

import { FeatureFlag } from "@/features/flags";
import { Message, useChat } from "@ai-sdk/react";
import { Button } from "@headlessui/react";
import { useSchematicFlag } from "@schematichq/schematic-react";
import { BotIcon, ImageIcon, LetterText, PenIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SecureContent } from "@/lib/secureContentRenderer";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  result?: Record<string, unknown>;
}

interface ToolPart {
  type: "tool-invocation";
  toolInvocation: ToolInvocation;
}

const formatToolInvocation = (part: ToolPart) => {
  if (!part.toolInvocation) return "Unknown tool";
  return `🔧 Tool Used: ${part.toolInvocation.toolName}`;
};

/**
 * Processes assistant messages to clean up duplicates and preserve markdown formatting
 */
const processAssistantMessage = (content: string): string => {
  if (!content) return "";

  // Extract the main content without duplications
  // Looking for the most detailed and complete version
  if (content.includes("Summary of")) {
    // For summary-style responses, find the full summary section
    const summaryMatch = content.match(/Summary of[^]+/);
    if (summaryMatch && summaryMatch[0]) {
      return summaryMatch[0];
    }
  }

  // Strip common repetitive intro phrases to avoid duplication
  const cleanContent = content.replace(
    /^(I'd be happy to|Let me|Here's|I'll|Certainly|I can|Sure|Okay|Now,|I have|I will|Based on|Looking at|Analyzing|Inspecting)/i,
    ""
  );

  return cleanContent;
};

function AiAgentChat({ videoId }: { videoId: string }) {
  // Scrolling to Bottom Logic
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, append, status } =
    useChat({
      maxSteps: 5,
      body: {
        videoId,
      },
    });

  const isScriptGenerationEnabled = useSchematicFlag(
    FeatureFlag.SCRIPT_GENERATION
  );
  const isImageGenerationEnabled = useSchematicFlag(
    FeatureFlag.IMAGE_GENERATION
  );
  const isTitleGenerationEnabled = useSchematicFlag(
    FeatureFlag.TITLE_GENERATION
  );
  const isVideoAnalysisEnabled = useSchematicFlag(FeatureFlag.ANALYSE_VIDEO);

  useEffect(() => {
    if (bottomRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let toastId;

    switch (status) {
      case "submitted":
        toastId = toast("Agent is thinking...", {
          id: toastId,
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "streaming":
        toastId = toast("Agent is replying...", {
          id: toastId,
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "error":
        toastId = toast("Whoops! Something went wrong, please try again.", {
          id: toastId,
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "ready":
        toast.dismiss(toastId);
        break;
    }
  }, [status]);

  const generateScript = async () => {
    const randomId = Math.random().toString(36).substring(2, 15);

    const userMessage: Message = {
      id: `generate-script-${randomId}`,
      role: "user",
      content:
        "Generate a step-by-step shooting script for this video that I can use on my own channel to produce a video that is similar to this one, dont do any other steps such as generating a image, just generate the script only!",
    };
    append(userMessage);
  };

  const generateImage = async () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    const userMessage: Message = {
      id: `generate-image-${randomId}`,
      role: "user",
      content: "Generate a thumbnail for this video",
    };
    append(userMessage);
  };

  const generateTitle = async () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    const userMessage: Message = {
      id: `generate-title-${randomId}`,
      role: "user",
      content: "Generate a title for this video",
    };
    append(userMessage);
  };

  return (
    <div className="flex flex-col h-full border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
      <div className="hidden lg:block px-4 pb-3 border-b border-primary/10">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          ClipSage AI Agent
        </h2>
      </div>
      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        ref={messagesContainerRef}
      >
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white/70">
                Welcome to ClipSage AI Agent. Ask me anything about the video.
              </h3>
              <p className="text-sm text-gray-600 dark:text-white/70">
                I can help you with video analysis, transcription, and more.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-primary/10 dark:bg-primary/70"
                    : "bg-gray-100 dark:bg-gray-200"
                }`}
              >
                {m.parts && m.role === "assistant" ? (
                  // AI message
                  <div className="space-y-3">
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        <div
                          key={i}
                          className="prose dark:prose-dark prose-sm max-w-none"
                        >
                          {/* Use SecureContent for rendering AI-generated content */}
                          <SecureContent
                            content={processAssistantMessage(m.content)}
                            allowMarkdown={true}
                          />
                        </div>
                      ) : part.type === "tool-invocation" ? (
                        <div
                          key={i}
                          className="bg-white/50 rounded-lg p-2 space-y-2 text-gray-700"
                        >
                          <div className="font-medium text-sm">
                            {formatToolInvocation(part as ToolPart)}
                          </div>
                          {(part as ToolPart).toolInvocation.result && (
                            <pre className="text-sm bg-white dark:bg-black/10 rounded p-2 overflow-auto max-h-40">
                              {JSON.stringify(
                                (part as ToolPart).toolInvocation.result,
                                null,
                                2
                              )}
                            </pre>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  // User message (no need for sanitization as it's user-generated)
                  <div className="prose dark:prose-dark prose-sm text-gray-500 dark:text-gray-200">
                    <SecureContent content={m.content} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-primary/10 bg-white dark:bg-black/0">
        <div className="space-x-3 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2 mb-2.5">
            <input
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-primary/10 rounded-lg focus:outline-none focus:ring focus:ring-primary/50 dark:focus:ring-primary/50"
              value={input}
              onChange={handleInputChange}
              type="text"
              placeholder={
                !isVideoAnalysisEnabled
                  ? "Upgrade to ask anything about your video..."
                  : "Ask anything about your video..."
              }
            />
            <Button
              type="submit"
              disabled={
                status === "streaming" ||
                status === "submitted" ||
                !isVideoAnalysisEnabled
              }
              className="px-4 py-2 bg-primary dark:bg-primary/70 text-white text-sm rounded-lg hover:bg-primary/20 hover:text-primary/90 hover:border hover:border-primary/50 hover:dark:bg-primary/30 hover:dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "streaming"
                ? "AI is replying..."
                : status === "submitted"
                  ? "AI is thinking..."
                  : "Send"}
            </Button>
          </form>
          <div className="flex gap-2">
            <button
              className="text-xs xl:text-sm text-white w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary dark:bg-primary/70 hover:bg-primary/20 hover:text-primary/90 hover:border hover:border-primary hover:dark:bg-primary/30 hover:dark:text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateScript}
              type="button"
              disabled={!isScriptGenerationEnabled}
            >
              <LetterText className="w-4 h-4" />
              {isScriptGenerationEnabled ? (
                <span>Generate Script</span>
              ) : (
                <span className="">Upgrade to generate a script</span>
              )}
            </button>

            <button
              className="text-xs xl:text-sm text-white w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary dark:bg-primary/70 hover:bg-primary/20 hover:text-primary/90 hover:border hover:border-primary hover:dark:bg-primary/30 hover:dark:text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateTitle}
              type="button"
              disabled={!isTitleGenerationEnabled}
            >
              <PenIcon className="w-4 h-4" />
              {isTitleGenerationEnabled ? (
                <span>Generate Title</span>
              ) : (
                <span className="">Upgrade to generate a title</span>
              )}
            </button>

            <button
              className="text-xs xl:text-sm text-white w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary dark:bg-primary/70 hover:bg-primary/20 hover:text-primary/90 hover:border hover:border-primary hover:dark:bg-primary/30 hover:dark:text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateImage}
              type="button"
              disabled={!isImageGenerationEnabled}
            >
              <ImageIcon className="w-4 h-4" />
              {isImageGenerationEnabled ? (
                <span>Generate Thumbnail</span>
              ) : (
                <span className="">Upgrade to generate a thumbnail</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AiAgentChat;
