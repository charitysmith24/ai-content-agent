// Allow up to 5 minutes for server actions in this route segment.
// gpt-image-1.5 at 1536x1024 + Vision analysis can take 90–120 seconds;
// without this the default Next.js timeout kills the connection mid-upload.
export const maxDuration = 300;

export default function StoryboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
