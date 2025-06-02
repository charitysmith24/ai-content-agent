import { Video } from "lucide-react";

type AgentPulseProps = {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "tertiary";
};

function AgentPulse({ size = "medium", color = "primary" }: AgentPulseProps) {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  const colorClasses = {
    primary: "bg-primary/60 shadow-[0_0_2px_4px_rgba(226,29,72,0.8)]",
    secondary: "bg-secondary/60 shadow-[0_0_8px_4px_rgba(39,39,42,0.8)]",
    tertiary: "bg-tertiary/60 shadow-[0_0_8px_4px_rgba(229,54,112,0.8)]",
  };
  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full ring-2 ring-white/50 animate-pulse`}
    >
      <Video
        className={`${sizeClasses[size]} animate-pulse text-white/50 dark:text-rose-700 place-items-center p-2`}
      />
    </div>
  );
}
export default AgentPulse;
