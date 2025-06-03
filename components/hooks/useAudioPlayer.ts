import { useState, useEffect, useRef, useCallback } from "react";

type AudioPlayerState = {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  error: Error | null;
};

type UseAudioPlayerReturn = AudioPlayerState & {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  togglePlayback: () => void;
  resetError: () => void;
};

/**
 * Check if code is running on the client side
 */
const isClient = typeof window !== "undefined";

/**
 * Custom hook for audio playback with error handling
 * @param url Audio URL to play
 * @param onEnded Callback for when audio playback completes
 * @returns Audio player state and controls
 */
export function useAudioPlayer(
  url: string | undefined,
  onEnded?: () => void
): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    progress: 0,
    duration: 0,
    error: null,
  });

  // Store the current URL to detect changes
  const currentUrlRef = useRef<string | undefined>(url);

  // Reset error state
  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (!isClient || !audioRef.current || !url || typeof url !== "string") {
      return;
    }

    const audio = audioRef.current;

    if (state.isPlaying) {
      audio.pause();
    } else {
      // Reset error state before attempting to play
      setState((prev) => ({ ...prev, error: null }));

      // Play with error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing audio:", error);
          setState((prev) => ({
            ...prev,
            error: new Error("Failed to play audio. Please try again."),
            isPlaying: false,
          }));
        });
      }
    }
  }, [state.isPlaying, url]);

  // Main effect to handle audio setup and URL changes
  useEffect(() => {
    // Skip on server
    if (!isClient) return;

    // If URL hasn't changed, don't do anything
    if (currentUrlRef.current === url) return;

    // Update current URL ref
    currentUrlRef.current = url;

    // Reset state when URL changes
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      progress: 0,
      error: null,
      isLoading: false,
      duration: 0,
    }));

    // If no URL, clean up and return
    if (!url || typeof url !== "string") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: new Error("Invalid audio URL format"),
        isLoading: false,
      }));
      return;
    }

    // Create or reset audio element
    if (!audioRef.current) {
      audioRef.current = new window.Audio();
      audioRef.current.preload = "metadata";
    }

    const audio = audioRef.current;

    // Event handlers
    const handleLoadStart = () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        duration: audio.duration || 0,
      }));
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: audio.duration || 0,
        isLoading: false,
      }));
    };

    const handleTimeUpdate = () => {
      if (audio.duration > 0) {
        const progress = (audio.currentTime / audio.duration) * 100;
        setState((prev) => ({ ...prev, progress }));
      }
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      const target = e.target as HTMLAudioElement;
      let errorMessage = "Failed to load or play audio";

      if (target?.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Audio loading was aborted. Please try again.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage =
              "Network error loading audio. Check your connection.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Audio file is corrupted or in unsupported format.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported by your browser.";
            break;
          default:
            errorMessage = "Unknown audio error occurred.";
        }
      }

      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: new Error(errorMessage),
      }));
    };

    const handleAbort = () => {
      console.log("Audio loading aborted");
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        error: new Error("Audio loading was interrupted. Please try again."),
      }));
    };

    // Add event listeners
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("abort", handleAbort);

    // Set loading state and load audio
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    audio.src = url;
    audio.load();

    // Cleanup function
    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("abort", handleAbort);
    };
  }, [url, onEnded]); // Only depend on url and onEnded

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  return {
    ...state,
    audioRef,
    togglePlayback,
    resetError,
  };
}
