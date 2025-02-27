"use server";
import { redirect } from "next/navigation";

export async function anyalzeYoutubeVideo(formData: FormData) {
  const url = formData.get("url") as string;
  if (!url) return;

  const videoId = "abc123"; // TODO: Extract video ID from URL

  if (!videoId) {
    return redirect("/error");
  }

  //Redirect
  redirect(`/video/${videoId}/analysis`);
}
