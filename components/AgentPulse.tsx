type AgentPulseProps = {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "tertiary";
};

function AgentPulse({ size = "medium", color = "primary" }: AgentPulseProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  const colorClasses = {
    primary: "bg-primary/60 shadow-[0_0_8px_4px_rgba(226,29,72,0.8)]",
    secondary: "bg-secondary/60 shadow-[0_0_8px_4px_rgba(39,39,42,0.1)]",
    tertiary: "bg-tertiary/60 shadow-[0_0_8px_4px_rgba(229,54,112,0.1)]",
  };
  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
    />
  );
}
export default AgentPulse;
