/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { FeatureFlag } from "@/features/flags";
import { useUser } from "@clerk/nextjs";
import Usage from "./Usage";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { Copy } from "lucide-react";

function TitleGeneration({ videoId }: { videoId: string }) {
  const { user } = useUser();
  const titles = []; // TODO: PUll from convex

  //console.log("user", user);
  console.log("videoId", videoId);

  const { value: isTitleGenerationEnabled } = useSchematicEntitlement(
    FeatureFlag.TITLE_GENERATION
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // toast.success("Copied to clipboard");
  };

  return (
    <div className="rounded-xl flex flex-col">
      <div className="min-w-52">
        <Usage
          featureFlag={FeatureFlag.TITLE_GENERATION}
          title="Title Generation"
        />
      </div>

      {/* Titles Grid */}
      <div className="space-y-3 mt-4 max-h-[280px] overflow-y-auto">
        {/* {titles?.map((title) => (
          <div
            key={title._id}
            className="group relative p-4 rounded-lg border border-gray-100 dark:border-primary/50 hover:border-primary/10 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
                {title.title}
              </p>
              <button
                onClick={() => copyToClipboard(title.title)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-primary/0 rounded-md"
                title="Copy to clipboard"
              >
                <Copy className="size-4 text-primary/70" />
              </button>
            </div>
          </div>
        ))} */}
      </div>

      {/* No titles yet */}
      {!titles?.length && !!isTitleGenerationEnabled && (
        <div className="text-center py-8 px-4 rounded-lg mt-4 border-2 border-dashed border-gray-200">
          <p className="text-gray-400 dark:text-white">
            No Titles generated yet.
          </p>
          <p className="text-sm text-gray-400 dark:text-white/20 mt-1">
            Generate titles to them appear here
          </p>
        </div>
      )}
    </div>
  );
}
export default TitleGeneration;
