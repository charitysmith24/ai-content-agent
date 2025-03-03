"use client";
import { useChat } from "@ai-sdk/react";
import { Button } from "@headlessui/react";
import ReactMarkdown from "react-markdown";

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
  return `Tool Used: ${part.toolInvocation.toolName}`;
};

function AiAgentChat({ videoId }: { videoId: string }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 5,
    body: {
      videoId,
    },
  });
  return (
    <div className="flex flex-col h-full border border-primary/70 dark:border-primary/50 p-2 rounded-xl">
      <div className="hidden lg:block px-4 pb-3 border-b border-primary/10">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          ClipSage AI Agent
        </h2>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
                  <div className="space-y-3">
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        <div key={i} className="prose dark:prose-dark prose-sm">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
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
                  <div className="prose dark:prose-dark prose-sm text-gray-500 dark:text-gray-200">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat Input */}
      <div className="border-t border-primary/10 bg-white dark:bg-black/0">
        <div className="space-x-3 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-primary/10 rounded-lg focus:outline-none focus:ring focus:ring-primary/50 dark:focus:ring-primary/50"
              value={input}
              onChange={handleInputChange}
              type="text"
              placeholder="Enter a question..."
            />
            <Button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default AiAgentChat;
