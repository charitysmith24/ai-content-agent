// components/ui/ImageGenerationLoading.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Camera,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export enum LoadingState {
  IDLE = "idle",
  GENERATING = "generating",
  PROCESSING = "processing",
  UPLOADING = "uploading",
  COMPLETED = "completed",
  ERROR = "error",
}

interface ImageGenerationLoadingProps {
  state: LoadingState;
  progress?: number;
  characterContext?: string;
  onRetry?: () => void;
  errorMessage?: string;
  className?: string;
}

const loadingMessages = {
  [LoadingState.GENERATING]: {
    title: "🎨 Creating Your Scene",
    description: "AI is generating a unique visual representation...",
    icon: Sparkles,
    color: "blue",
  },
  [LoadingState.PROCESSING]: {
    title: "⚡ Processing Visual Elements",
    description: "Applying character consistency and visual style...",
    icon: Loader2,
    color: "purple",
  },
  [LoadingState.UPLOADING]: {
    title: "📤 Finalizing Image",
    description: "Almost done! Saving your scene image...",
    icon: Camera,
    color: "green",
  },
  [LoadingState.COMPLETED]: {
    title: "✨ Image Created Successfully!",
    description: "Your scene now has a professional visual representation",
    icon: CheckCircle,
    color: "green",
  },
  [LoadingState.ERROR]: {
    title: "❌ Generation Failed",
    description: "Something went wrong during image generation",
    icon: AlertCircle,
    color: "red",
  },
};

export function ImageGenerationLoading({
  state,
  progress = 0,
  characterContext,
  onRetry,
  errorMessage,
  className = "",
}: ImageGenerationLoadingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [loadingTips, setLoadingTips] = useState(0);

  const tips = [
    "AI is analyzing your scene content for optimal visual representation",
    "Ensuring character consistency across your storyboard",
    "Applying professional video production styling",
    "Creating high-quality imagery suitable for content creation",
  ];

  // Animate progress bar
  useEffect(() => {
    if (progress > animatedProgress) {
      const timer = setTimeout(() => {
        setAnimatedProgress((prev) => Math.min(prev + 1, progress));
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [progress, animatedProgress]);

  // Rotate loading tips
  useEffect(() => {
    if (
      state === LoadingState.GENERATING ||
      state === LoadingState.PROCESSING
    ) {
      const interval = setInterval(() => {
        setLoadingTips((prev) => (prev + 1) % tips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [state, tips.length]);

  if (state === LoadingState.IDLE) {
    return null;
  }

  const messageConfig = loadingMessages[state];
  const IconComponent = messageConfig.icon;

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Animated background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          messageConfig.color === "blue"
            ? "from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
            : messageConfig.color === "purple"
              ? "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
              : messageConfig.color === "green"
                ? "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                : messageConfig.color === "red"
                  ? "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20"
                  : "from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20"
        }`}
      />

      {/* Animated overlay for active states */}
      {(state === LoadingState.GENERATING ||
        state === LoadingState.PROCESSING) && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 space-y-6">
        {/* Icon with animation */}
        <div className="relative">
          <div
            className={`p-4 rounded-full ${
              messageConfig.color === "blue"
                ? "bg-blue-100 dark:bg-blue-900/40"
                : messageConfig.color === "purple"
                  ? "bg-purple-100 dark:bg-purple-900/40"
                  : messageConfig.color === "green"
                    ? "bg-green-100 dark:bg-green-900/40"
                    : messageConfig.color === "red"
                      ? "bg-red-100 dark:bg-red-900/40"
                      : "bg-gray-100 dark:bg-gray-900/40"
            }`}
          >
            <IconComponent
              className={`h-8 w-8 ${
                messageConfig.color === "blue"
                  ? "text-blue-600 dark:text-blue-300"
                  : messageConfig.color === "purple"
                    ? "text-purple-600 dark:text-purple-300"
                    : messageConfig.color === "green"
                      ? "text-green-600 dark:text-green-300"
                      : messageConfig.color === "red"
                        ? "text-red-600 dark:text-red-300"
                        : "text-gray-600 dark:text-gray-300"
              } ${
                state === LoadingState.PROCESSING ||
                state === LoadingState.GENERATING
                  ? "animate-spin"
                  : ""
              }`}
            />
          </div>

          {/* Pulse ring for active states */}
          {(state === LoadingState.GENERATING ||
            state === LoadingState.PROCESSING) && (
            <div
              className={`absolute inset-0 rounded-full border-2 ${
                messageConfig.color === "blue"
                  ? "border-blue-300"
                  : messageConfig.color === "purple"
                    ? "border-purple-300"
                    : "border-blue-300"
              } animate-ping`}
            />
          )}
        </div>

        {/* Title and description */}
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {messageConfig.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {errorMessage || messageConfig.description}
          </p>

          {/* Rotating tips for loading states */}
          {(state === LoadingState.GENERATING ||
            state === LoadingState.PROCESSING) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic transition-all duration-500">
              💡 {tips[loadingTips]}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {progress > 0 &&
          state !== LoadingState.ERROR &&
          state !== LoadingState.COMPLETED && (
            <div className="w-full max-w-sm space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    messageConfig.color === "blue"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : messageConfig.color === "purple"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : messageConfig.color === "green"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-blue-500 to-purple-500"
                  }`}
                  style={{ width: `${animatedProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {Math.round(animatedProgress)}% complete
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                  {state === LoadingState.GENERATING
                    ? "Generating..."
                    : state === LoadingState.PROCESSING
                      ? "Processing..."
                      : state === LoadingState.UPLOADING
                        ? "Saving..."
                        : "Working..."}
                </span>
              </div>
            </div>
          )}

        {/* Character context info */}
        {characterContext &&
          (state === LoadingState.GENERATING ||
            state === LoadingState.PROCESSING) && (
            <div className="w-full max-w-md p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                    Maintaining Character Consistency
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {characterContext}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Error state actions */}
        {state === LoadingState.ERROR && onRetry && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Success state celebration */}
        {state === LoadingState.COMPLETED && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300 mr-2" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Ready for your storyboard!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGenerationLoading;
