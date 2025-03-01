"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import AgentPulse from "./AgentPulse";
import ThemeToggle from "@/components/ThemeToggle";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

function Header() {
  const { theme } = useTheme();
  return (
    <header className="sticky top-0 z-50 left-0 right-0 md:px-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-white/10 dark:border-gray-800">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-4">
              <AgentPulse size="small" color="primary" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
                ClipSage
              </h1>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <SignedIn>
              <Link href={`/manage-plan`}>
                <Button
                  variant={"outline"}
                  className="mr-4 bg-gradient-to-r from-primary to-rose-700 text-transparent bg-clip-text border-primary/40 dark:border-primary/40 font-bold"
                >
                  Manage Plan
                </Button>
              </Link>
            </SignedIn>
            <ThemeToggle />
            <div className="size-9 px-8 flex items-center justify-center rounded-md">
              <UserButton
                appearance={{
                  baseTheme: theme === "dark" ? dark : undefined,
                  elements: {
                    avatarBox: {
                      width: 35,
                      height: 35,
                    },
                  },
                }}
              >
                {/* <UserButton.MenuItems>
                <UserButton.Link
                  label="Billing"
                  labelIcon={<CreditCard className="size-4" />}
                  href="/billing"
                />
              </UserButton.MenuItems> */}
              </UserButton>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant={"ghost"}
                    className="p-2 bg-gradient-to-r from-primary to-rose-700 text-transparent bg-clip-text text-sm uppercase"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              {/* <div>
                <ThemeToggle />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
