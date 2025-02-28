import { FeatureFlag } from "@/features/flags";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { useState } from "react";
import Usage from "./Usage";

interface TranscriptEntry {
  text: string;
  timestamp: string;
}

function Transcription({ videoId }: { videoId: string }) {
  const [transcript, setTranscript] = useState<{
    transcript: TranscriptEntry[];
    cache: string;
  } | null>(null);
  const { featureUsageExceeded } = useSchematicEntitlement(
    FeatureFlag.TRANSCRIPTION
  );

  return (
    <div className="rounded-xl flex flex-col">
      <div className="min-w-52">
        <Usage
          featureFlag={FeatureFlag.TITLE_GENERATION}
          title="Transcription"
        />
        {/* transcription */}
        {!featureUsageExceeded ? (
          <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto rounded-md p-4">
            {transcript ? (
              transcript.transcript.map((entry) => (
                <div key={entry.timestamp} className="flex gap-2">
                  <p className="text-sm text-gray-700 dark:text-white">
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
