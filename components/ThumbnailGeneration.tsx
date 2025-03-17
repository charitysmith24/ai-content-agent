"use client";

import { useUser } from "@clerk/nextjs";
import Usage from "./Usage";
import { FeatureFlag } from "@/features/flags";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ThumbnailGeneration({ videoId }: { videoId: string }) {
  const { user } = useUser();
  const images = useQuery(api.images.getImages, {
    videoId,
    userId: user?.id ?? "",
  });

  return (
    <div className="rounded-xl flex flex-col">
      <div className="min-w-52">
        <Usage
          featureFlag={FeatureFlag.IMAGE_GENERATION}
          title="Thumbnail Generation"
        />
      </div>
      {/* Image Grid */}
      <div className={`flex overflow-x-auto gap-4 ${images?.length && "mt-4"}`}>
        {images?.map(
          (image) =>
            image.url && (
              <div
                key={image._id}
                className="flex-none w-[200px] h-[110px] rounded-lg overflow-x-auto"
              >
                <Dialog>
                  <DialogTrigger>
                    <Image
                      loading="lazy"
                      src={image.url}
                      alt={`Generated Image`}
                      width={200}
                      height={200}
                      className="object-cover"
                    />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Your AI Generated Thumbnail</DialogTitle>
                      <DialogDescription>
                        <Image
                          loading="lazy"
                          src={image.url}
                          alt={`Generated Image`}
                          width={500}
                          height={500}
                          className="object-cover"
                        />
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            )
        )}

        {/* No Images */}
        {!images?.length && (
          <div className="w-full text-center py-8 px-4 rounded-lg mt-4 border-2 border-dashed border-gray-200">
            <p className="text-gray-400 dark:text-white">
              No Images generated yet.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/80 mt-1">
              Generate thumbnails to them appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default ThumbnailGeneration;
