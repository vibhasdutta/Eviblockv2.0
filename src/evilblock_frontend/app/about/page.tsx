import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  CornerDownRight,
  BatteryCharging,
  GitPullRequest,
  Layers,
  RadioTower,
  SquareKanban,
  WandSparkles,
  Github,
  Linkedin,
  Twitter,
  Database,
  Shield,
  Users,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContainer, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/linear-modal";
import { AnimatedNumberDemo } from "@/components/AnimatedNumber";


interface Hero1Props {
  badge?: string;
  heading: string;
  description: string;
  buttons?: {
    primary?: {
      text: string;
      url: string;
    };
    secondary?: {
      text: string;
      url: string;
    };
  };
  image: {
    src: string;
    alt: string;
  };
}

const Hero1 = ({
  badge = "",
  heading = "Blocks Built With Shadcn & Tailwind",
  description = "Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy and paste these blocks directly into their project.",
  buttons = {
    primary: {
      text: "Discover all components",
      url: "https://www.shadcnblocks.com",
    },
    secondary: {
      text: "View on GitHub",
      url: "https://www.shadcnblocks.com",
    },
  },
  image = {
    src: "/secure-storage-hero.png",
    alt: "Secure decentralized storage visualization",
  },
}: Hero1Props) => {
  return (
    <section className="pt-20 pb-32 px-4">
      <div className="container">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {badge && (
              <Badge variant="outline">
                {badge}
                <ArrowUpRight className="ml-2 size-4" />
              </Badge>
            )}
            <h1 className="my-6 text-pretty text-4xl font-bold lg:text-6xl">{heading}</h1>
            <p className="text-muted-foreground mb-8 max-w-xl lg:text-xl">
              {description}
            </p>
            <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
              {buttons.primary && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={buttons.primary.url}>{buttons.primary.text}</a>
                </Button>
              )}
              {buttons.secondary && (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href={buttons.secondary.url}>
                    {buttons.secondary.text}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          <img
            src={image.src}
            alt={image.alt}
            className="max-h-96 w-full rounded-md object-cover border border-border/50 shadow-sm"
          />
        </div>
      </div>
    </section>
  );
};

const Process1 = () => {
  const process = [
    {
      step: "01",
      title: "Select Verification Level",
      description:
        "Choose from three security tiers: Simple (storage only), Evidence (video proof), or Legal (full government-grade KYC with AI verification). Tailor the verification level to your document's importance.",
    },
    {
      step: "02",
      title: "Secure Encryption & Upload",
      description:
        "Documents are AES-256 encrypted before upload. For legal documents, AI begins analyzing content to generate custom verification questions. Metadata is stored on the Internet Computer blockchain, while encrypted files are secured on IPFS.",
    },
    {
      step: "03",
      title: "Identity & Video Verification",
      description:
        "For Legal and Evidence documents, complete video verification and identity checks. Record yourself reading a verification statement on camera to link the document to your real-world identity, preventing fraud and impersonation.",
    },
    {
      step: "04",
      title: "AI-Powered Document Verification",
      description:
        "Legal tier documents undergo AI-powered verification with questions generated from your document's content. This ensures you've read and understand the document you're certifying, adding an extra layer of authenticity.",
    },
    {
      step: "05",
      title: "Immutable Certification",
      description:
        "Once verified, a permanent, tamper-proof record is minted on the blockchain. You receive a cryptographic certificate proving the document's authenticity, timestamp, and ownership.",
    },
  ];

  return (
    <section id="process" className="py-32 px-4">
      <div className="container">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-6 lg:gap-20">
          <div className="top-10 col-span-2 h-fit w-fit gap-3 space-y-7 py-8 lg:sticky">
            <div className="relative w-fit text-5xl font-semibold tracking-tight lg:text-7xl">
              {" "}
              <h2 className="text-3xl font-bold">How EviBlock Works</h2>
              <Asterisk className="absolute -right-2 -top-2 size-5 text-orange-500 md:size-10 lg:-right-14" />
            </div>
            <p className="text-foreground/50 text-base">
              EviBlock combines IPFS decentralized storage with Internet Computer Protocol blockchain technology to create a secure, transparent, and community-driven file verification ecosystem.
            </p>

            <Button
              variant="ghost"
              className="flex items-center justify-start gap-2"
            >
              <CornerDownRight className="text-orange-500" />
              Get in touch
            </Button>
          </div>
          <ul className="lg:pl-22 relative col-span-4 w-full">
            {process.map((step, index) => (
              <li
                key={index}
                className="relative flex flex-col justify-between gap-10 border-t py-8 md:flex-row lg:py-10"
              >
                <Illustration className="absolute right-0 top-4" />

                <div className="bg-muted flex size-12 items-center justify-center px-4 py-1 tracking-tighter">
                  0{index + 1}
                </div>
                <div className="">
                  <h3 className="mb-4 text-2xl font-semibold tracking-tighter lg:text-3xl">
                    {step.title}
                  </h3>
                  <p className="text-foreground/50">{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

const Illustration = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="22"
      height="20"
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line
        x1="0.607422"
        y1="2.57422"
        x2="21.5762"
        y2="2.57422"
        stroke="#FF0000"
        strokeWidth="4"
      />
      <line
        x1="19.5762"
        y1="19.624"
        x2="19.5762"
        y2="4.57422"
        stroke="#FF0000"
        strokeWidth="4"
      />
    </svg>
  );
};

interface Feature {
  heading: string;
  description: string;
  icon: React.ReactNode;
}

interface Feature43Props {
  id?: string;
  title?: string;
  features?: Feature[];
  buttonText?: string;
  buttonUrl?: string;
}

const Feature43 = ({
  id,
  title = "Why Choose EviBlock for Decentralized Storage",
  features = [
    {
      heading: "Secure Decentralized Vault",
      description:
        "Files are stored on IPFS with AES-256 encryption. Your data is distributed across a global network but readable only by you and authorized verifiers.",
      icon: <Database className="size-6" />,
    },
    {
      heading: "Blockchain Immutability",
      description:
        "Every file upload and verification is recorded on the Internet Computer blockchain, creating an unalterable audit trail that proves authenticity and ownership.",
      icon: <Shield className="size-6" />,
    },
    {
      heading: "AI-Powered Verification",
      description:
        "Legal tier documents feature AI-generated questions from your document content. Combined with video KYC and government ID verification, this provides unmatched proof of document understanding and authenticity.",
      icon: <WandSparkles className="size-6" />,
    },
    {
      heading: "Multi-Tier Security",
      description:
        "Choose from Simple, Evidence, or Legal verification tiers. Each level offers increasing security, from basic storage to full AI verification with video proof and government-grade KYC.",
      icon: <Users className="size-6" />,
    },
    {
      heading: "Instant Certification",
      description:
        "Upon verification, a unique NFT-like certificate is minted on the blockchain, providing undeniable proof of your document's authenticity and your ownership.",
      icon: <WandSparkles className="size-6" />,
    },
    {
      heading: "Real-time Transparency",
      description:
        "View live statistics of total files stored and verification activities. Complete transparency ensures accountability across the entire network.",
      icon: <Layers className="size-6" />,
    },
    {
      heading: "Firebase Authentication",
      description:
        "Secure user authentication and management through Firebase, ensuring only authorized users can upload and verify files on the platform.",
      icon: <BatteryCharging className="size-6" />,
    },
  ],
  buttonText = "Get Started",
  buttonUrl = "/",
}: Feature43Props) => {
  return (
    <section id={id} className="py-32 px-4">
      <div className="container">
        {title && (
          <div className="mx-auto mb-16 max-w-3xl text-center px-4">
            <h2 className="text-pretty text-4xl font-medium lg:text-5xl">{title}</h2>
          </div>
        )}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="flex flex-col px-4">
              <div className="bg-primary/10 mb-5 flex size-16 items-center justify-center rounded-full border border-primary/20">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.heading}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
        {buttonUrl && (
          <div className="mt-16 flex justify-center">
            <Button size="lg" asChild>
              <a href={buttonUrl}>{buttonText}</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export { Feature43 };

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Vibhas Dutta",
      role: "Cybersecurity Developer",
      image: "/profile_photo/vibhas.jpg",
      bio: "Passionate Cybersecurity Student and Developer specializing in secure systems and blockchain technology.",
      description: "A dedicated cybersecurity student from India with expertise in Python development, secure coding practices, and Web Pentesting. With over 1,500 GitHub contributions, Vibhas has developed innovative security tools including PC-ASSISTANT (voice-operated PC control), ObfusEngine (script obfuscation engine), and various encryption systems. His work focuses on creating secure, decentralized solutions that protect user data and privacy.",
      skills: ["Python", "Cybersecurity", "Blockchain Technology", "Security Engineer", "Java", "Kotlin", "Linux", "Git", "Web Pentesting"],
      gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
      borderColor: "border-blue-500/30",
      backdropGradient: "dark:bg-[radial-gradient(125%_125%_at_50%_10%,#000_40%,#3b82f6_100%)] bg-[radial-gradient(125%_125%_at_50%_10%,#fff_40%,#3b82f6_100%)]",
      links: {
        linkedin: "https://www.linkedin.com/in/vibhas-dutta-366119248/",
        github: "https://github.com/vibhasdutta",
        twitter: "https://twitter.com/vibhas_dutta"
      }
    },
    {
      name: "Abhinav Rajpati",
      role: "Full-Stack Developer",
      image: "/profile_photo/abhinav.jpeg",
      bio: "Passionate Computer Science student with expertise in Python, web development, and database systems.",
      description: "A dedicated Computer Science student with a strong foundation in programming and software development. Abhinav has developed multiple projects including password management systems, student record databases, and economic analysis tools using Python and SQL. Currently working on a Steganography website, he brings practical experience in full-stack development and database management to the EviBlock team.",
      skills: ["Python", "Java", "C Programming", "HTML5", "MySQL", "Database Design", "Web Development", "Linux", "Git", "Data Analysis"],
      gradient: "from-orange-500/20 via-orange-500/5 to-transparent",
      borderColor: "border-orange-500/30",
      backdropGradient: "dark:bg-[radial-gradient(125%_125%_at_50%_10%,#000_40%,#f97316_100%)] bg-[radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f97316_100%)]",
      links: {
        linkedin: "https://www.linkedin.com/in/abhinavrajpati/",
        github: "https://github.com/Surventurer",
        twitter: ""
      }
    }
  ];

  return (
    <section className="py-32 px-4">
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center px-4">
          <h2 className="text-pretty text-4xl font-medium lg:text-5xl mb-4">MEET THE TEAM</h2>
          <p className="text-muted-foreground text-lg">
            Our talented team of professionals dedicated to delivering exceptional results.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 max-w-2xl mx-auto">
          {teamMembers.map((member, index) => (
            <Dialog key={index}>
              <DialogTrigger>
                <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="mb-4">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-32 h-32 rounded-full mx-auto object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">Click to learn more</p>
                </div>
              </DialogTrigger>
              <DialogContainer overlayClassName={member.backdropGradient}>
                <DialogContent className={`max-w-2xl mx-auto bg-white dark:bg-gray-900/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative border ${member.borderColor} overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} pointer-events-none opacity-50`} />
                  <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-20" />
                  <div className="relative z-10 text-center">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary/20"
                    />
                    <DialogTitle className="text-2xl font-semibold mb-2">{member.name}</DialogTitle>
                    <p className="text-primary font-medium mb-4">{member.role}</p>
                    <DialogDescription className="text-muted-foreground mb-6">{member.bio}</DialogDescription>

                    <div className="text-left mb-6">
                      <h4 className="font-semibold mb-3 text-lg">About</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{member.description}</p>
                    </div>

                    <div className="text-left mb-6">
                      <h4 className="font-semibold mb-3 text-lg">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-left">
                      <h4 className="font-semibold mb-3 text-lg">Connect</h4>
                      <div className="flex gap-4 justify-center">
                        {member.links.github && (
                          <a href={member.links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                            <Github size={24} />
                          </a>
                        )}
                        {member.links.linkedin && (
                          <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                            <Linkedin size={24} />
                          </a>
                        )}
                        {member.links.twitter && (
                          <a href={member.links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                            <Twitter size={24} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </DialogContainer>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  );
};

export { TeamSection };

const TechShowcase = () => {
  const technologies = [
    {
      name: "Internet Computer Protocol",
      description: "The revolutionary blockchain that powers Web3. ICP enables smart contracts to run directly on the internet, providing unlimited scalability and true decentralization.",
      logo: "🔗",
      category: "Blockchain"
    },
    {
      name: "IPFS",
      description: "InterPlanetary File System - the distributed storage network that makes the web faster, safer, and more open. Files are stored across thousands of nodes worldwide.",
      logo: "🌐",
      category: "Storage"
    },
    {
      name: "Rust",
      description: "The backend canister is built with Rust, ensuring memory safety, high performance, and reliability for critical blockchain operations.",
      logo: "🦀",
      category: "Backend"
    },
    {
      name: "Next.js",
      description: "Modern React framework for the frontend, providing server-side rendering, static generation, and optimal performance for Web3 applications.",
      logo: "⚡",
      category: "Frontend"
    },
    {
      name: "Firebase Auth",
      description: "Secure user authentication and identity management, ensuring only verified users can participate in the file storage and verification ecosystem.",
      logo: "🔐",
      category: "Authentication"
    },
    {
      name: "Pinata",
      description: "IPFS pinning service that ensures your files remain permanently available on the decentralized network, with enterprise-grade reliability.",
      logo: "📌",
      category: "Infrastructure"
    }
  ];

  return (
    <section className="py-32 px-4">
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center px-4">
          <h2 className="text-pretty text-4xl font-medium lg:text-5xl mb-4">POWERED BY CUTTING-EDGE TECHNOLOGY</h2>
          <p className="text-muted-foreground text-lg">
            Built on the Internet Computer Protocol and IPFS, EviBlock represents the future of decentralized file storage and verification.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {technologies.map((tech, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{tech.logo}</div>
              <h3 className="text-xl font-semibold mb-2">{tech.name}</h3>
              <p className="text-sm text-primary font-medium mb-3 bg-primary/10 px-3 py-1 rounded-full">{tech.category}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{tech.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { TechShowcase };

export default function About() {
  return (
    <div className="min-h-screen">
      <AnimatedNumberDemo />
      <Hero1
        badge=""
        heading="Secure, Immutable File Storage with Identity Verification"
        description="EviBlock combines IPFS decentralized storage with Internet Computer Protocol blockchain immutability. Store, verify, and share files with cryptographic guarantees of authenticity and linked real-world identity."
        buttons={{
          primary: {
            text: "How It Works",
            url: "#process",
          },
          secondary: {
            text: "Features",
            url: "#features",
          },
        }}
        image={{
          src: "/secure-storage-hero.png",
          alt: "Secure decentralized storage visualization"
        }}
      />
      <Process1 />
      <Feature43 id="features" buttonUrl="" />
      <TechShowcase />
      <TeamSection />
    </div>
  );
}
