import { Github, Twitter, Video, Instagram, Linkedin } from "lucide-react";
import { Footer } from "@/components/ui/footer";

function FooterWrapper() {
  return (
    <div className="bg-gradient-to-b from-white via-rose-300 to-rose-700 dark:from-black/90 dark:via-black/50 dark:to-black/0 px-4 py-12">
      <div className="container w-full mx-auto">
        <Footer
          logo={<Video className="size-10 animate-pulse text-rose-700" />}
          brandName="ClipSage"
          socialLinks={[
            {
              icon: <Twitter className="size-5 text-rose-700 bg-transparent" />,
              href: "https://x.com/CharitySmith24",
              label: "Twitter",
            },
            {
              icon: (
                <Instagram className="size-5 text-rose-700 bg-transparent" />
              ),
              href: "https://www.instagram.com/charity.smith24/",
              label: "GitHub",
            },
            {
              icon: (
                <Linkedin className="size-5 text-rose-700 bg-transparent" />
              ),
              href: "https://www.linkedin.com/in/charitysmith40175/",
              label: "LinkedIn",
            },
            {
              icon: <Github className="size-5 text-rose-700 bg-transparent" />,
              href: "https://github.com/charitysmith24",
              label: "GitHub",
            },
          ]}
          mainLinks={[
            { href: "/newsletter", label: "Newsletter" },
            { href: "/contact", label: "Contact" },
          ]}
          legalLinks={[
            { href: "/privacy", label: "Privacy" },
            { href: "/tos", label: "Terms" },
          ]}
          copyright={{
            text: "© 2025 Techvaultlabs",
            license: "All rights reserved",
          }}
        />
      </div>
    </div>
  );
}

export { FooterWrapper };
