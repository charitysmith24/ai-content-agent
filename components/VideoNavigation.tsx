"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil, Layers } from "lucide-react";

interface VideoNavigationProps {
  videoId: string;
}

function VideoNavigation({ videoId }: VideoNavigationProps) {
  const pathname = usePathname();

  const isAnalysisPage = pathname.includes('/analysis');
  const isStoryboardPage = pathname.includes('/storyboard');

  return (
    <div className="flex items-center gap-2 border border-primary/70 dark:border-primary/50 rounded-xl mx-6 p-2 bg-white dark:bg-black/10 mb-4">
      <Link
        href={`/video/${videoId}/analysis`}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isAnalysisPage
            ? "bg-primary text-white"
            : "hover:bg-primary/10 text-gray-700 dark:text-gray-300"
        }`}
      >
        <Pencil className="size-4" />
        Analysis
      </Link>
      <Link
        href={`/video/${videoId}/storyboard`}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isStoryboardPage
            ? "bg-primary text-white"
            : "hover:bg-primary/10 text-gray-700 dark:text-gray-300"
        }`}
      >
        <Layers className="size-4" />
        Storyboard
      </Link>
    </div>
  );
}

export default VideoNavigation; 