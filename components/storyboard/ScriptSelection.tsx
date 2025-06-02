"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { FileText, Film, Clock } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ScriptSelectionProps {
  videoId: string;
  selectedScriptId: string | null;
  onSelectScript: (scriptId: Id<"scripts">) => void;
}

function ScriptSelection({ videoId, selectedScriptId, onSelectScript }: ScriptSelectionProps) {
  const { user } = useUser();
  const scripts = useQuery(api.scripts.getScripts, { 
    videoId, 
    userId: user?.id ?? "" 
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scripts</h2>
        <div className="text-xs text-gray-500">
          {scripts?.length || 0} available
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
        {scripts?.map((script) => (
          <div
            key={script._id}
            onClick={() => onSelectScript(script._id)}
            className={`p-3 rounded-md border cursor-pointer transition-all ${
              selectedScriptId === script._id
                ? "border-primary bg-primary/5 dark:bg-primary/20"
                : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-2 bg-primary/10 dark:bg-primary/20 rounded-md">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {script.scriptTitle}
                </h3>
                
                {/* Script meta info */}
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Film className="h-3 w-3" />
                    <span>{script.scriptType || "General"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(script.createdAt)}</span>
                  </div>
                </div>
                
                {/* Preview */}
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {script.script.substring(0, 100)}...
                </p>
              </div>
            </div>
          </div>
        ))}

        {!scripts?.length && (
          <div className="text-center py-12 px-4">
            <FileText className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No scripts available</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Generate scripts in the Analysis page first
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScriptSelection; 