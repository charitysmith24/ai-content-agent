"use server";
import { getVideoFormUrl } from "@/lib/getVideoFormUrl";
import { redirect } from "next/navigation";

export async function anyalzeYoutubeVideo(formData: FormData) {
  const url = formData.get("url") as string;
  if (!url) return;

  const videoId = getVideoFormUrl(url);

  console.log("videoId is >>>", videoId);

  if (!videoId) {
    return redirect("/error");
  }

  //Redirect
  redirect(`/video/${videoId}/analysis`);
}
