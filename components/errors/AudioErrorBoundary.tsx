import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AudioErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface AudioErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AudioErrorBoundary extends Component<
  AudioErrorBoundaryProps,
  AudioErrorBoundaryState
> {
  constructor(props: AudioErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): AudioErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error("Audio playback error:", error);
    console.error("Error info:", errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI for audio errors
      return (
        <div className="rounded-md p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Audio playback error</span>
          </div>
          <p className="text-xs mt-1">
            {this.state.error?.message ||
              "An error occurred while playing audio."}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-2 flex items-center text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AudioErrorBoundary;
