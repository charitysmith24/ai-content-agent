import { Github, Twitter, Brain, Instagram, Linkedin } from "lucide-react";
import { Footer } from "@/components/ui/footer";

function FooterWrapper() {
  return (
    <div className="w-full">
      <Footer
        logo={<Brain className="h-10 w-10 animate-pulse text-rose-700" />}
        brandName="ClipSage"
        socialLinks={[
          {
            icon: <Twitter className="h-5 w-5 text-rose-700" />,
            href: "https://x.com/CharitySmith24",
            label: "Twitter",
          },
          {
            icon: <Instagram className="h-5 w-5 text-rose-700" />,
            href: "https://www.instagram.com/charity.smith24/",
            label: "GitHub",
          },
          {
            icon: <Linkedin className="h-5 w-5 text-rose-700" />,
            href: "https://www.linkedin.com/in/charitysmith40175/",
            label: "LinkedIn",
          },
          {
            icon: <Github className="h-5 w-5 text-rose-700" />,
            href: "https://github.com/charitysmith24",
            label: "GitHub",
          },
        ]}
        mainLinks={[
          { href: "/#", label: "Newsletter" },
          { href: "/contact", label: "Contact" },
        ]}
        legalLinks={[
          { href: "/privacy", label: "Privacy" },
          { href: "/tos", label: "Terms" },
        ]}
        copyright={{
          text: "© 2024 ClipSage.",
          license: "All rights reserved",
        }}
      />
    </div>
  );
}

export { FooterWrapper };
