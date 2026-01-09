"use client";
import { MoveRight, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/globe";
import BlurText from "@/components/ui/Blurtext";
import AnimatedContent from "@/components/ui/animatedcontent";
import { LineShadowText } from "@/components/ui/line-shadow-text";
import { Banner1 } from "@/components/Banner1";

interface Hero115Props {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  button: {
    text: string;
    icon?: React.ReactNode;
    url: string;
  };
  trustText?: string;
}

const Hero115 = ({
  icon = <ShieldCheck className="size-16" />,

  description = "Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy and paste these blocks directly into their project.",
  button = {
    text: "Discover Features",
    icon: <MoveRight className="ml-2 size-4" />,
    url: "https://www.shadcnblocks.com",
  },
  trustText = "Trusted by 25.000+ Businesses Worldwide",
}: Hero115Props) => {
  return (
    <section className="overflow-hidden pt-32 pb-0">
      <div className="container">
        <div className="flex flex-col gap-5">
          <div className="relative flex flex-col gap-5">
            <div
              style={{
                transform: "translate(-50%, -50%)",
              }}
              className="absolute left-1/2 top-1/2 -z-10 mx-auto size-[800px] rounded-full border border-primary/20 p-16 [mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-[1300px] md:p-32"
            >
              <div className="size-full rounded-full border border-primary/10 p-16 md:p-32">
                <div className="size-full rounded-full border border-primary/10"></div>
              </div>
            </div>

            <span className="mx-auto flex size-16 items-center justify-center rounded-full border md:size-20">
              {icon}
            </span>
            <h1 className="text-balance text-5xl font-semibold leading-none tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl text-center">
              Welcome to{" "}
              <LineShadowText className="italic" shadowColor={"black"}>
                Eviblock
              </LineShadowText>
            </h1>
            <BlurText
              text={description}
              className="text-muted-foreground mx-auto max-w-3xl text-center md:text-lg justify-center"
              delay={30}
              animateBy="words"
            />
            <AnimatedContent
              direction="vertical"
              distance={50}
              duration={0.8}
              delay={0.3}
            >
              <div className="flex flex-col items-center justify-center gap-3 pt-3">
                <Button size="lg" asChild>
                  <a href={button.url}>
                    {button.text} {button.icon}
                  </a>
                </Button>
                {trustText && (
                  <div className="text-muted-foreground text-xs">{trustText}</div>
                )}
              </div>
            </AnimatedContent>
          </div>
          <div className="relative mx-auto h-[600px] w-full max-w-[600px] -mt-32 -z-10 -mb-[300px]">
            <Globe />
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [imageError, setImageError] = useState(false);

  return (
    <>
      <Banner1
        title="🚀 Welcome To Eviblock v2.0"
        description="Explore our latest blockchain verification tools"
        linkText="Learn more"
        linkUrl="/about"
      />
      <Hero115
        icon={imageError ? <ShieldCheck className="size-16" /> : <Image src="/company_assests/blockchain.png" alt="Eviblock Logo" width={64} height={64} style={{ objectFit: 'contain' }} onError={() => setImageError(true)} />}
        heading="Welcome to Eviblock"
        description="Building the future of blockchain technology with cutting-edge solutions and innovative platforms."
        button={{
          text: "Get Started",
          icon: <Zap className="ml-2 size-4" />,
          url: "/document-type-selection",
        }}
        trustText="Trusted by developers worldwide"
      />
    </>
  );
}
