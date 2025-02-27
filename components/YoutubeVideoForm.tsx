"use client";

import Form from "next/form";
import { Input } from "./ui/input";
import AnalyzeButton from "./AnalyzeButton";
import { anyalzeYoutubeVideo } from "@/actions/analyzeYoutubeVideo";

function YoutubeVideoForm() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form
        action={anyalzeYoutubeVideo}
        className="flex flex-col sm:flex-row gap-2 items-center"
      >
        <Input
          name="url"
          placeholder="Enter Youtube URL"
          className="flex-1 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-transparent transition-all duration-200"
        />
        <AnalyzeButton />
      </Form>
    </div>
  );
}
export default YoutubeVideoForm;
