import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ImageProps {
  src: string;
  alt: string;
  srcDark?: string;
}

export interface ButtonConfig {
  text: string;
  url: string;
  icon?: React.ReactNode;
}

export interface ButtonsConfig {
  primary?: ButtonConfig;
  secondary?: ButtonConfig;
}

export interface BadgeConfig {
  text: string;
  announcement?: string;
  url?: string;
}

export interface HeroBasicProps {
  badge?: BadgeConfig;
  heading: string;
  description: string;
  buttons?: ButtonsConfig;
  image: ImageProps;
  className?: string;
}

export interface Hero34Props extends HeroBasicProps {}
export type Props = Partial<Hero34Props>;

const defaultProps: HeroBasicProps = {
  badge: {
    text: "NEW TEST · FIELD READY",
    announcement: "NCB Forensic Ledger v2.4",
  },
  heading: "Forensic Analysis Built for the Field",
  description:
    "Presumptive colorimetric screening, sealed chain-of-custody tracking, and instant offline-first biometric logging designed for narcotics enforcement.",
  buttons: {
    primary: {
      text: "Start Field Test",
      url: "/scan",
    },
    secondary: {
      text: "View Audit Ledger",
      url: "/audit",
    },
  },
  image: {
    src: "/forensic_lab_hero_banner.jpg",
    alt: "Forensic Laboratory Visual",
  },
};

export const Hero34 = (props: Props) => {
  const { badge, heading, description, buttons, image, className } = {
    ...defaultProps,
    ...props,
  };

  return (
    <section className={cn("w-full py-4", className)}>
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 rounded-2xl border border-white/10 bg-[#101112] text-white shadow-2xl lg:grid-cols-2 overflow-hidden">
          <div className="flex flex-col items-center p-8 sm:p-12 text-center lg:items-start lg:text-left">
            {badge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-500 mb-6">
                <span>{badge.text}</span>
                {badge.announcement && (
                  <>
                    <span className="opacity-40">|</span>
                    <span className="text-zinc-300 font-normal">{badge.announcement}</span>
                  </>
                )}
              </div>
            )}
            <h1 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-5xl">
              {heading}
            </h1>
            <p className="mb-8 max-w-xl text-sm sm:text-base text-zinc-400">
              {description}
            </p>
            <div className="flex w-full flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              {buttons?.primary && (
                <Button asChild className="bg-[#FF8A1D] hover:bg-[#FF901F] text-black font-bold h-12 px-6 rounded-xl shadow-lg shadow-orange-500/20">
                  <a href={buttons.primary.url}>
                    {buttons.primary.text}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              {buttons?.secondary && (
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-6 rounded-xl">
                  <a href={buttons.secondary.url}>{buttons.secondary.text}</a>
                </Button>
              )}
            </div>
          </div>
          <div className="relative h-full min-h-[320px] w-full overflow-hidden">
            <img
              src={image.src}
              alt={image.alt}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101112] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#101112] lg:via-transparent lg:to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero34;
