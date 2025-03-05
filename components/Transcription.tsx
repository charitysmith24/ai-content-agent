import { FeatureFlag } from "@/features/flags";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { useCallback, useEffect, useState } from "react";
import Usage from "./Usage";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";

interface TranscriptEntry {
  text: string;
  timestamp: string;
}

function Transcription({ videoId }: { videoId: string }) {
  console.log("videoId", videoId);

  const [transcript, setTranscript] = useState<{
    transcript: TranscriptEntry[];
    cache: string;
  } | null>(null);

  const { featureUsageExceeded } = useSchematicEntitlement(
    FeatureFlag.TRANSCRIPTION
  );

  const handleGenerateTranscription = useCallback(
    async (videoId: string) => {
      if (featureUsageExceeded) {
        console.log("Transcription limit reached, the user must upgrade");
        return;
      }

      const result = await getYoutubeTranscript(videoId);

      setTranscript(result);
    },
    [featureUsageExceeded]
  );

  useEffect(() => {
    handleGenerateTranscription(videoId);
  }, [handleGenerateTranscription, videoId]);

  return (
    <div className="rounded-xl flex flex-col">
      <div className="min-w-52">
        <Usage featureFlag={FeatureFlag.TRANSCRIPTION} title="Transcription" />
        {/* transcription */}
        {!featureUsageExceeded ? (
          <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto rounded-md p-4">
            {transcript ? (
              transcript.transcript.map((entry, index) => (
                <div key={index} className="flex gap-2">
                  <p className="text-sm text-gray-700 dark:text-white min-w-[50px]">
                    {entry.timestamp}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No transcription available
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
export default Transcription;
