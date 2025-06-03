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

  // Reset state when URL changes
  useEffect(() => {
    if (!isClient) return; // Skip on server

    if (audioRef.current) {
      audioRef.current.pause();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        progress: 0,
        error: null,
      }));
    }
  }, [url]);

  // Set up audio element when URL is available
  useEffect(() => {
    // Skip on server or if URL is invalid
    if (!isClient || !url || typeof url !== "string") return;

    // Safely create or reuse audio element
    try {
      // Create audio element in a browser-safe way
      if (!audioRef.current) {
        // Create element only on client
        audioRef.current = new window.Audio();
      }

      // Early return if we couldn't create an audio element
      if (!audioRef.current) {
        throw new Error("Failed to create audio element");
      }

      const audio = audioRef.current;

      // Set source after ensuring audio element exists
      audio.src = url;

      // Set up audio event listeners
      const handlePlay = () =>
        setState((prev) => ({ ...prev, isPlaying: true }));
      const handlePause = () =>
        setState((prev) => ({ ...prev, isPlaying: false }));
      const handleEnded = () => {
        setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
        if (onEnded) onEnded();
      };
      const handleTimeUpdate = () => {
        setState((prev) => ({
          ...prev,
          progress: (audio.currentTime / audio.duration) * 100,
        }));
      };
      const handleLoadStart = () =>
        setState((prev) => ({ ...prev, isLoading: true }));
      const handleCanPlay = () => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          duration: audio.duration || 0,
        }));
      };
      const handleError = (e: Event) => {
        console.error("Audio playback error:", e);
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: new Error("Failed to load or play audio"),
        }));
      };

      // Add event listeners
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      // Clean up
      return () => {
        audio.pause();
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
      };
    } catch (error) {
      console.error("Error initializing audio element:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to initialize audio player"),
      }));
      return undefined;
    }
  }, [url, onEnded]);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    // Skip if not on client or missing audio/URL
    if (!isClient || !audioRef.current || !url || typeof url !== "string")
      return;

    try {
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
            setState((prev) => ({ ...prev, error }));
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error in audio playback:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [state.isPlaying, url]);

  // Reset error state
  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    audioRef,
    togglePlayback,
    resetError,
  };
}
