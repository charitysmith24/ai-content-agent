"use client";

import { FeatureFlag } from "@/features/flags";
import { useUser } from "@clerk/nextjs";
import Usage from "./Usage";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Copy, FileText, Calendar, Tag } from "lucide-react";
import { toast } from "sonner";

function ScriptGeneration({ videoId }: { videoId: string }) {
  const { user } = useUser();
  const scripts = useQuery(api.scripts.getScripts, { 
    videoId, 
    userId: user?.id ?? "" 
  });

  const { value: isScriptGenerationEnabled } = useSchematicEntitlement(
    FeatureFlag.SCRIPT_GENERATION
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Script copied to clipboard");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScriptTypeColor = (type?: string) => {
    switch (type) {
      case "tutorial":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "marketing":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "entertainment":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "educational":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getTitleSourceIcon = (source?: string) => {
    switch (source) {
      case "ai_generated":
        return "🤖";
      case "original_video":
        return "📺";
      case "user_defined":
        return "👤";
      default:
        return "⚡";
    }
  };

  return (
    <div className="rounded-xl flex flex-col">
      <div className="min-w-52">
        <Usage
          featureFlag={FeatureFlag.SCRIPT_GENERATION}
          title="Script Generation"
        />
      </div>

      {/* Scripts Grid */}
      <div className="space-y-3 mt-4 max-h-[280px] overflow-y-auto">
        {scripts?.map((script) => (
          <div
            key={script._id}
            className="group relative p-4 rounded-lg border border-primary/70 dark:border-primary/50 hover:border-primary/50 hover:bg-rose-50 hover:dark:bg-primary/70 transition-all duration-200"
          >
            {/* Script Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {script.scriptTitle}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {/* Script Type Badge */}
                  {script.scriptType && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getScriptTypeColor(script.scriptType)}`}>
                      <Tag className="size-3" />
                      {script.scriptType}
                    </span>
                  )}
                  {/* Title Source */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {getTitleSourceIcon(script.titleSource)}
                    {script.titleSource === "ai_generated" ? "AI Title" : 
                     script.titleSource === "original_video" ? "Original" : 
                     script.titleSource === "user_defined" ? "Custom" : "Auto"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(script.script)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-primary/10 rounded-md"
                title="Copy script to clipboard"
              >
                <Copy className="size-4 text-primary/70 dark:text-white" />
              </button>
            </div>

            {/* Title Information */}
            {(script.generatedTitle || script.videoTitle) && (
              <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {script.generatedTitle ? "Generated Title:" : "Video Title:"}
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                  {script.generatedTitle || script.videoTitle}
                </p>
              </div>
            )}

            {/* Script Preview */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {script.script.substring(0, 150)}
                {script.script.length > 150 && "..."}
              </p>
            </div>

            {/* Footer with metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(script.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="size-3" />
                {Math.round(script.script.length / 4)} words
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No scripts yet */}
      {!scripts?.length && !!isScriptGenerationEnabled && (
        <div className="text-center py-8 px-4 rounded-lg mt-4 border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <FileText className="size-8 text-gray-400 dark:text-gray-500 mx-auto" />
          </div>
          <p className="text-gray-400 dark:text-gray-500 font-medium">
            No Scripts generated yet.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Generate scripts using the AI agent to see them appear here
          </p>
        </div>
      )}

      {/* Feature disabled state */}
      {!isScriptGenerationEnabled && (
        <div className="text-center py-6 px-4 rounded-lg mt-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-amber-700 dark:text-amber-300 font-medium">
            Script Generation Disabled
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Upgrade your plan to generate scripts
          </p>
        </div>
      )}
    </div>
  );
}

export default ScriptGeneration;