import { internalActionGeneric } from "convex/server";

// Define a helper for creating internal actions that can only be called by other Convex functions
export const internalAction = internalActionGeneric;

/**
 * Gets an environment variable, throwing an error if it's not set
 * @param name Environment variable name
 * @param defaultValue Optional default value if not set
 * @returns The environment variable value
 */
export function getRequiredEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Formats an error for consistent error messages
 * @param error The error object
 * @param context Additional context to add to the error message
 * @returns Formatted error message
 */
export function formatError(error: unknown, context?: string): string {
  let message = "Unknown error";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    message = error.message;
  }

  if (context) {
    return `${context}: ${message}`;
  }

  return message;
}

/**
 * Safely parses JSON without throwing
 * @param text JSON string to parse
 * @param defaultValue Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(text: string, defaultValue: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Decodes a base64 string to a Uint8Array
 *
 * This is a Convex-compatible implementation that doesn't rely on
 * Node.js Buffer or browser atob()
 *
 * @param base64 The base64 string to decode
 * @returns Uint8Array containing the decoded data
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  // First, remove any non-base64 characters and padding
  const cleanBase64 = base64.replace(/[^A-Za-z0-9+/]/g, "");

  // Lookup table for base64 characters
  const lookupTable =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const len = cleanBase64.length;
  const paddingLength = (4 - (len % 4)) % 4; // Calculate padding length
  const outputLength =
    Math.floor(((len + paddingLength) * 3) / 4) - paddingLength;
  const output = new Uint8Array(outputLength);

  let position = 0;

  // Process groups of 4 characters
  for (let i = 0; i < len; i += 4) {
    // Get values of base64 characters
    const b1 = lookupTable.indexOf(cleanBase64.charAt(i));
    const b2 = lookupTable.indexOf(cleanBase64.charAt(i + 1));
    const b3 =
      i + 2 < len ? lookupTable.indexOf(cleanBase64.charAt(i + 2)) : 64; // 64 means padding
    const b4 =
      i + 3 < len ? lookupTable.indexOf(cleanBase64.charAt(i + 3)) : 64; // 64 means padding

    // Combine the 4 6-bit values into 3 bytes
    if (position < outputLength) output[position++] = (b1 << 2) | (b2 >> 4);
    if (position < outputLength)
      output[position++] = ((b2 & 15) << 4) | (b3 >> 2);
    if (position < outputLength) output[position++] = ((b3 & 3) << 6) | b4;
  }

  return output;
}
