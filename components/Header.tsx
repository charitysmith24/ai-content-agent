"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import AgentPulse from "./AgentPulse";
import ThemeToggle from "@/components/ThemeToggle";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
  SheetFooter,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

function Header() {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-white/10 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <AgentPulse size="small" color="primary" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
              ClipSage
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedIn>
              <Link href={`/manage-plan`}>
                <Button
                  variant={"outline"}
                  className="bg-gradient-to-r from-primary to-rose-700 text-transparent bg-clip-text border-primary/40 dark:border-primary/40 font-bold"
                >
                  Manage Plan
                </Button>
              </Link>
            </SignedIn>
            <ThemeToggle />
            <div className="flex items-center justify-center">
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
              />
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
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <SheetHeader className="px-6 py-4 border-b dark:border-gray-800">
                  <SheetTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-rose-700 bg-clip-text text-transparent">
                    ClipSage Menu
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    Access your account and features
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col px-6 py-6 space-y-6">
                  <SignedIn>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground/70">
                        Account
                      </h3>
                      <Link
                        href={`/manage-plan`}
                        onClick={() => setIsOpen(false)}
                        className="block"
                      >
                        <Button
                          variant={"outline"}
                          className="w-full justify-start bg-gradient-to-r from-primary to-rose-700 text-transparent bg-clip-text border-primary/40 dark:border-primary/40 font-bold"
                        >
                          Manage Plan
                        </Button>
                      </Link>
                    </div>
                  </SignedIn>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground/70">
                      Preferences
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                <SheetFooter className="px-6 py-4 mt-auto border-t dark:border-gray-800">
                  <div className="flex items-center justify-between w-full">
                    <SignedOut>
                      <SignInButton mode="modal">
                        <Button
                          variant={"default"}
                          className="w-full bg-gradient-to-r from-primary to-rose-700 hover:from-primary/90 hover:to-rose-700/90"
                        >
                          Sign In
                        </Button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          Your Account
                        </span>
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
                        />
                      </div>
                    </SignedIn>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
