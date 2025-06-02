"use client";

import { FeatureFlag } from "@/features/flags";
import {
  useSchematicEntitlement,
  useSchematicIsPending,
} from "@schematichq/schematic-react";
import { Progress } from "./ui/progress";

function Usage({
  featureFlag,
  title,
}: {
  featureFlag: FeatureFlag;
  title: string;
}) {
  const isPending = useSchematicIsPending();

  console.log("FEATURE FLAG USED: ", featureFlag);

  const {
    featureAllocation,
    featureUsage,
    value: isFeatureEnabled,
  } = useSchematicEntitlement(featureFlag);

  // Debug the exact values
  console.log(`${featureFlag} - FEATURE ALLOCATION:`, featureAllocation);
  console.log(`${featureFlag} - FEATURE USAGE:`, featureUsage);

  const hasUsedAllTokens =
    featureUsage && featureAllocation && featureUsage >= featureAllocation;

  if (isPending) {
    return <div className="text-gray-500 text-center py-4">Loading...</div>;
  }

  if (hasUsedAllTokens) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <div className="flex justifiy-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <div className="px-4 py-2 bg-red-50 rounded-lg">
            <span className="font-medium text-red-700">{featureUsage}</span>
            <span className="text-red-400 mx-2">/</span>
            <span className="font-medium text-red-700">
              {featureAllocation}
            </span>
          </div>
        </div>
        <div className="relative">
          <Progress
            value={100}
            className="h-3 rounded-full bg-gray-100 [&>*]:bg-red-800"
          />
          <p className="text-sm text-red-800 mt-2">
            You have used all available tokens. Please upgrade your plan to
            continue using this feature.
          </p>
        </div>
      </div>
    );
  }

  if (!isFeatureEnabled) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-50">
        <div className="flex justifiy-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <div className="px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Feature Disabled</span>
          </div>
        </div>
        <div className="relative">
          <Progress value={0} className="h-3 rounded-full bg-gray-100" />
          <p className="text-sm text-gray-500 mt-2">
            Upgrade to use this feature.
          </p>
        </div>
      </div>
    );
  }

  const progress = ((featureUsage || 0) / (featureAllocation || 1)) * 100;

  console.log("PROGRESS: ", progress);

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "[&>*]:bg-red-600";
    if (percent >= 50) return "[&>*]:bg-yellow-500";
    return "[&>*]:bg-green-500";
  };

  const progressColor = getProgressColor(progress);
  console.log("PROGRESS COLOR: ", progressColor);

  return (
    <div className="bg-gradient-to-b from-white to-rose-50 dark:from-primary/0 dark:to-primary/10 rounded-2xl shadow-lg border border-primary/70 dark:border-primary/10 p-6">
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          {title}
        </h2>
        <div className="px-4 py-2 bg-gray-50 dark:bg-primary/0 rounded-lg">
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {featureUsage ?? 0}
          </span>
          <span className="text-gray-400 mx-2">/</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {featureAllocation ?? 50}
          </span>
        </div>
      </div>
      <div className="relative">
        <Progress
          value={progress}
          className={`h-2 rounded-full bg-gray-300 ${progressColor}`}
        />

        {progress >= 100 ? (
          <p className="text-sm text-red-700 mt-2">
            You have reached your usage limit for the month.
          </p>
        ) : progress >= 80 ? (
          <p className="text-sm text-red-600 mt-2">
            Warning: You are close to reaching your usage limit for the month!
          </p>
        ) : null}
      </div>
    </div>
  );
}
export default Usage;
