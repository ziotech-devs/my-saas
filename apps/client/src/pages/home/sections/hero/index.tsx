import { t } from "@lingui/macro";
import { Badge, buttonVariants } from "@my-saas/ui";
import { cn } from "@my-saas/utils";
import { ArrowRightIcon, GithubLogoIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { HeroCTA } from "./call-to-action";
import { Decoration } from "./decoration";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export const HeroSection = () => (
  <section id="hero" className="relative overflow-hidden">
    <style>{`
      @keyframes hero-shimmer {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .hero-title {
        background: linear-gradient(
          120deg,
          hsl(var(--foreground)) 0%,
          hsl(var(--primary)) 35%,
          hsl(var(--foreground)) 55%,
          hsl(var(--primary)) 80%,
          hsl(var(--foreground)) 100%
        );
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: hero-shimmer 6s ease-in-out infinite;
      }
    `}</style>

    <Decoration.Grid />
    <Decoration.Gradient />

    {/* Ambient radial glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]"
    />

    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center lg:px-12">
      <motion.div
        className="flex w-full flex-col items-center gap-y-8"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {/* Badge + link */}
        <motion.div className="flex items-center gap-x-4" variants={item}>
          <Badge>{t`Version 1.0`}</Badge>
          <a
            href="https://github.com/ziotech-devs/my-saas"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "link" }), "space-x-2")}
          >
          <GithubLogoIcon className="mr-3" />
            <p>{t`Source code`}</p>
            <ArrowRightIcon />
          </a>
        </motion.div>

        {/* Headline */}
        <motion.div className="space-y-3" variants={item}>
<h1 className="hero-title text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-8xl">
            {t`A free and open-source SaaS boilerplate`}
          </h1>
        </motion.div>

        {/* Subheading */}
        <motion.p
          className="prose prose-base prose-zinc max-w-2xl text-lg leading-8 dark:prose-invert"
          variants={item}
        >
          {t`A free and open-source SaaS boilerplate that simplifies the process of creating, updating, and sharing your SaaS application.`}
        </motion.p>

        {/* CTA */}
        <motion.div className="flex items-center gap-x-8" variants={item}>
          <HeroCTA />
        </motion.div>
      </motion.div>
    </div>
  </section>
);
