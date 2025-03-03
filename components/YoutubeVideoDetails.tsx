"use client";

import { getVideoDetails } from "@/actions/getVideoDetails";
import { VideoDetails } from "@/types/types";
import { Calendar, Eye, MessageCircle, ThumbsUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

function YoutubeVideoDetails({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<VideoDetails | null>(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      const video = await getVideoDetails(videoId);
      setVideo(video);
    };

    fetchVideoDetails();
  }, [videoId]);

  if (!video)
    return (
      <div className="flex justify-center items-center p-4">
        <div className="size-8 border-4 border-primary/20 border-t-primary/80 rounded-full animate-spin"></div>
      </div>
    );

  console.log("Video Details", video);

  return (
    <div className="@container bg-white dark:bg-primary/0 rounded-xl">
      <div className="flex flex-col gap-4 border border-primary/0 dark:border-primary/50 rounded-xl mb-4">
        <div className="flex flex-col gap-8">
          {/* Video Thumbnail */}
          <div className="flex-shrink-0">
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={500}
              height={500}
              className="w-full rounded-xl shadow-md shadow-primary/50 hover:shadow-lg transition-shadow duration-300"
            />
          </div>
          {/* Video Details*/}
          <div className="flex-grow space-y-4">
            <h1 className="prose prose-sm text-xl @lg:text-2xl font-bold text-gray-700 dark:text-white leading-tight line-clamp-2">
              {video.title}
            </h1>
            {/* Channel Info */}
            <div className="flex items-center gap-4">
              <Image
                src={video.channel.thumbnail}
                alt={video.channel.title}
                width={48}
                height={48}
                className="siz-10 @md:size-12 rounded-full border-2 border-gray-100"
              />
              <div>
                <p className="text-base @md:text-lg font-semibold text-gray-700 dark:text-white/80">
                  {video.channel.title}
                </p>
                <p className="text-sm @md:text-base text-gray-600 dark:text-white/70">
                  {video.channel.subscribers} subscribers
                </p>
              </div>
            </div>
            {/* Video Metrics */}
            <div className="grid grid-cols-2 @lg:grid-cols-4 gap-4 pt-4">
              <div className="bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/10 rounded-lg p-3 transition-all duration-300 hover:to-rose/60 hover:from-primary/10 dark:hover:bg-primary/50 border border-primary/70 dark:border-primary/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="size-4 text-gray-600 dark:text-white/90" />
                  <p className="text-sm text-gray-600 dark:text-white/90">
                    Published
                  </p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white/90">
                  {new Date(video.publishedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/10 rounded-lg p-3 transition-all duration-300 hover:to-rose/60 hover:from-primary/10 dark:hover:bg-primary/50 border border-primary/70 dark:border-primary/50">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="size-4 text-gray-600 dark:text-white/90" />
                  <p className="text-sm text-gray-600 dark:text-white/90">
                    Views
                  </p>
                </div>
                <p className="font-medium text-gray-600 dark:text-white/90">
                  {video.views}
                </p>
              </div>
              <div className="bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/10 rounded-lg p-3 transition-all duration-300 hover:to-rose/60 hover:from-primary/10 dark:hover:bg-primary/50 border border-primary/70 dark:border-primary/50">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="size-4 text-gray-600 dark:text-white/90" />
                  <p className="text-sm text-gray-600 dark:text-white/90">
                    Likes
                  </p>
                </div>
                <p className="font-medium text-gray-600 dark:text-white/90">
                  {video.likes}
                </p>
              </div>
              <div className="bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/10 rounded-lg p-3 transition-all duration-300 hover:to-rose/60 hover:from-primary/10 dark:hover:bg-primary/50 border border-primary/70 dark:border-primary/50">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="size-4 text-gray-600 dark:text-white/90" />
                  <p className="text-sm text-gray-600 dark:text-white/90">
                    Comments
                  </p>
                </div>
                <p className="font-medium text-gray-600 dark:text-white/90">
                  {video.comments}
                </p>
              </div>
            </div>
            {/* Description */}
            <div className="prose prose-sm lg:prose-lg text-gray-700 dark:text-white/80">
              <p>{video.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default YoutubeVideoDetails;
