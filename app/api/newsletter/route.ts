import { NextResponse } from "next/server";
import { z } from "zod";
import arcjet, { shield, fixedWindow } from "@arcjet/next";

// Email validation schema
const subscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

// Configure Arcjet with security rules specific to this API endpoint
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Protect against common attacks with Shield
    shield({
      mode: "DRY_RUN", // Start in DRY_RUN mode to monitor without blocking
    }),
    // Rate limit requests to prevent spam
    fixedWindow({
      mode: "DRY_RUN", // Start in DRY_RUN mode
      window: "10m", // 10 minute window
      max: 5, // Maximum 5 requests per window per IP
    }),
  ],
});

export async function POST(req: Request) {
  try {
    // Apply Arcjet protection to this route
    const decision = await aj.protect(req);

    // Log decision results for monitoring
    console.log("Arcjet Newsletter Decision:", decision.conclusion);

    // If the request is denied by Arcjet, return an appropriate response
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "Too many subscription attempts. Please try again later." },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: "Request blocked for security reasons." },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      // Return validation errors
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Additional email validation - check for disposable email domains
    const disposableDomains = [
      "mailinator.com",
      "tempmail.com",
      "throwaway.com",
      "temp-mail.org",
      "guerrillamail.com",
    ];
    const emailDomain = email.split("@")[1];

    if (disposableDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: "Please use a valid, non-disposable email address." },
        { status: 400 }
      );
    }

    // Here you would typically add the email to your newsletter service
    // This is a placeholder for your actual implementation
    console.log(`Subscribing email: ${email}`);

    // Return success response
    return NextResponse.json(
      { message: "Successfully subscribed to the newsletter!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
