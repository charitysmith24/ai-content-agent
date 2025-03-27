"use client";

import { FeatureFlag } from "@/features/flags";
import { Message, useChat } from "@ai-sdk/react";
import { Button } from "@headlessui/react";
import { useSchematicFlag } from "@schematichq/schematic-react";
import { BotIcon, ImageIcon, LetterText, PenIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

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

// Function to handle assistant messages and clean up duplications
const processAssistantMessage = (message: Message) => {
  // If the message has no parts or content, return empty
  if (!message.content || !message.parts) return { content: "", toolParts: [] };

  // Extract tool parts separately
  const toolParts = message.parts.filter(
    (part) => part.type === "tool-invocation"
  ) as ToolPart[];

  // Process content to remove duplications
  let content = message.content;

  // Handle different types of AI responses, not just summaries

  // First, check if this is a summary by looking for "Summary of" pattern
  const summaryPattern = /.*?(Summary of[\s\S]*?)(?=🔧 Tool Used:|$)/;
  const summaryMatch = content.match(summaryPattern);

  if (summaryMatch && summaryMatch[1]) {
    // If we found a summary pattern, use just the final summary
    content = summaryMatch[1].trim();
  } else {
    // For other types of content, look for repeated intro phrases like "I'd be happy to"
    // and keep only the final most complete response
    const commonIntroPattern =
      /(I'd be happy to|Let me|I'll|I will|Here's|Based on the)[\s\S]*?(?=🔧 Tool Used:|$)/g;
    const matches = Array.from(content.matchAll(commonIntroPattern));

    if (matches.length > 1) {
      // If we found multiple intro phrases, use the last complete response
      // This assumes the final response is the most complete one
      content = matches[matches.length - 1][0].trim();
    }

    // Keep any markdown formatting in the response
    if (
      content.includes("#") ||
      content.includes("*") ||
      content.includes("```")
    ) {
      // If content has markdown, ensure we're not cutting off any formatting
      // Try to keep complete blocks, paragraphs, lists, etc.
      const lines = content.split("\n");
      if (lines.length > 2) {
        // Make sure we're not cutting off an opening code block, list, etc.
        const firstLine = 0;
        const lastLine = lines.length - 1;

        // Ensure we don't cut off markdown blocks
        const formattedContent = lines
          .slice(firstLine, lastLine + 1)
          .join("\n");
        content = formattedContent;
      }
    }
  }

  return { content, toolParts };
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
                {m.role === "assistant" ? (
                  // AI message - processed to avoid duplication
                  <div className="space-y-3">
                    {(() => {
                      const { content, toolParts } = processAssistantMessage(m);

                      return (
                        <>
                          {/* Display the main processed content */}
                          {content && (
                            <div className="prose dark:prose-dark prose-sm max-w-none">
                              <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                          )}

                          {/* Display tool parts separately */}
                          {toolParts.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {toolParts.map((part, i) => (
                                <div
                                  key={i}
                                  className="bg-white/50 rounded-lg p-2 space-y-2 text-gray-700"
                                >
                                  <div className="font-medium text-sm">
                                    {formatToolInvocation(part)}
                                  </div>
                                  {part.toolInvocation.result && (
                                    <pre className="text-sm bg-white dark:bg-black/10 rounded p-2 overflow-auto max-h-40">
                                      {JSON.stringify(
                                        part.toolInvocation.result,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  // User message
                  <div className="prose dark:prose-dark prose-sm text-gray-500 dark:text-gray-200">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
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
