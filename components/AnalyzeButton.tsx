"use client";
import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";

function AnalyzeButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="px-6 text-white bg-rose-700 rounded-lg hover:bg-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
    >
      {pending ? "Analysing..." : "Analyze"}
    </Button>
  );
}
export default AnalyzeButton;
