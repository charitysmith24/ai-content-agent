"use client";

import clerkTheme from "@/app/clerkTheme";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={clerkTheme}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl={"/"}
    >
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
