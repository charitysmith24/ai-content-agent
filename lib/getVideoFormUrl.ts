export function getVideoFormUrl(url: string): string | null {
  let videoId: string | null = null;

  if (url.includes("youtube.be/")) {
    videoId = url.split("youtube.be/")[1]?.split(/[?#]/)[0] || null;
  } else if (url.includes("youtube.com/shorts/")) {
    videoId = url.split("youtube.com/shorts/")[1]?.split(/[?#]/)[0] || null;
  } else if (url.split("v=").length > 1) {
    videoId = url.split("v=")[1]?.split("&")[0] || null;
  }
  return videoId;
}
