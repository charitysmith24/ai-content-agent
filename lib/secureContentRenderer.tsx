import DOMPurify from "dompurify";
import React from "react";
import ReactMarkdown from "react-markdown";

interface SecureContentOptions {
  /**
   * Whether to allow Markdown rendering
   */
  allowMarkdown?: boolean;
}

/**
 * Safely renders potentially unsafe content by:
 * 1. Sanitizing it with DOMPurify to remove XSS vectors
 * 2. Optionally parsing it as Markdown (if allowMarkdown is true)
 *
 * This is especially important for rendering AI-generated content
 * which could potentially contain malicious code
 */
export function renderSecureContent(
  content: string,
  options: SecureContentOptions = {}
) {
  const { allowMarkdown = true } = options;

  // Always sanitize content first
  const sanitizedContent = DOMPurify.sanitize(content);

  // If markdown is allowed, render it
  if (allowMarkdown) {
    return <ReactMarkdown>{sanitizedContent}</ReactMarkdown>;
  }

  // Otherwise just render as sanitized HTML
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

/**
 * React component version of the secure content renderer
 */
export function SecureContent({
  content,
  allowMarkdown = true,
}: {
  content: string;
  allowMarkdown?: boolean;
}) {
  return renderSecureContent(content, { allowMarkdown });
}
