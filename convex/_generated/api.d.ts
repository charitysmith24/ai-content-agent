/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chatHistory from "../chatHistory.js";
import type * as images from "../images.js";
import type * as scripts from "../scripts.js";
import type * as storyboard from "../storyboard.js";
import type * as titles from "../titles.js";
import type * as transcript from "../transcript.js";
import type * as userAnalytics from "../userAnalytics.js";
import type * as videos from "../videos.js";
import type * as voiceover from "../voiceover.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chatHistory: typeof chatHistory;
  images: typeof images;
  scripts: typeof scripts;
  storyboard: typeof storyboard;
  titles: typeof titles;
  transcript: typeof transcript;
  userAnalytics: typeof userAnalytics;
  videos: typeof videos;
  voiceover: typeof voiceover;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
