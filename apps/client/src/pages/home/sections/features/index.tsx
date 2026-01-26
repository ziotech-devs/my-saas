import { t } from "@lingui/macro";
import {
  BrainIcon,
  CloudIcon,
  CloudSunIcon,
  CurrencyDollarSimpleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  FileIcon,
  FilesIcon,
  FolderIcon,
  GitBranchIcon,
  GithubLogoIcon,
  GoogleChromeLogoIcon,
  GoogleLogoIcon,
  IconContext,
  LayoutIcon,
  LockIcon,
  NoteIcon,
  ProhibitIcon,
  ScalesIcon,
  StackSimpleIcon,
  StarIcon,
  SwatchesIcon,
  TextAaIcon,
  TranslateIcon,
} from "@phosphor-icons/react";
import { cn, languages, templatesList } from "@my-saas/utils";
import { motion } from "framer-motion";

type Feature = {
  icon: React.ReactNode;
  title: string;
  className?: string;
};

const featureLabel = cn(
  "flex cursor-default items-center justify-center gap-x-2 rounded bg-secondary px-4 py-3 text-sm font-medium leading-none text-primary transition-colors hover:bg-primary hover:text-background",
);

export const FeaturesSection = () => {
  const languagesCount = languages.length;
  const templatesCount = templatesList.length;

  const features: Feature[] = [
    { icon: <CurrencyDollarSimpleIcon />, title: t`Flexible pricing plans` },
    { icon: <GitBranchIcon />, title: t`API access included` },
    { icon: <ScalesIcon />, title: t`Transparent pricing` },
    { icon: <ProhibitIcon />, title: t`No hidden fees or tracking` },
    { icon: <CloudIcon />, title: t`Cloud-hosted solution` },
    { icon: <TranslateIcon />, title: t`Multi-language support` },
    { icon: <BrainIcon />, title: t`AI-powered features` },
    { icon: <GithubLogoIcon />, title: t`GitHub integration` },
    { icon: <GoogleLogoIcon />, title: t`Google Workspace integration` },
    { icon: <EnvelopeSimpleIcon />, title: t`Email notifications` },
    { icon: <LockIcon />, title: t`Enterprise-grade security` },
    { icon: <StackSimpleIcon />, title: t`${templatesCount}+ pre-built templates` },
    { icon: <FilesIcon />, title: t`Unlimited projects` },
    { icon: <FolderIcon />, title: t`Organize with folders` },
    { icon: <SwatchesIcon />, title: t`Custom branding` },
    { icon: <LayoutIcon />, title: t`Customizable dashboards` },
    { icon: <StarIcon />, title: t`Priority support` },
    { icon: <NoteIcon />, title: t`Collaborative notes` },
    { icon: <LockIcon />, title: t`Role-based access control` },
    { icon: <FileIcon />, title: t`Export to multiple formats` },
    { icon: <TextAaIcon />, title: t`Rich text editor` },
    { icon: <GoogleChromeLogoIcon />, title: t`Web-based platform` },
    { icon: <EyeIcon />, title: t`Analytics and insights` },
    { icon: <CloudSunIcon />, title: t`Light or dark theme` },
    {
      icon: (
        <div className="flex items-center space-x-1">
          <img src="https://cdn.simpleicons.org/react" alt="React" width={14} height={14} />
          <img src="https://cdn.simpleicons.org/vite" alt="Vite" width={14} height={14} />
          <img
            src="https://cdn.simpleicons.org/tailwindcss"
            alt="TailwindCSS"
            width={14}
            height={14}
          />
          <img src="https://cdn.simpleicons.org/nestjs" alt="NestJS" width={14} height={14} />
          <img
            src="https://cdn.simpleicons.org/googlechrome"
            alt="Google Chrome"
            width={14}
            height={14}
          />
          <img
            src="https://cdn.simpleicons.org/postgresql"
            alt="PostgreSQL"
            width={14}
            height={14}
          />
        </div>
      ),
      title: t`Powered by`,
      className: "flex-row-reverse",
    },
  ];

  return (
    <section id="features" className="relative bg-secondary-accent py-24 sm:py-32">
      <div className="container">
        <div className="space-y-6 leading-loose">
          <h2 className="text-4xl font-bold">{t`Everything you need to succeed.`}</h2>
          <p className="max-w-4xl text-base leading-relaxed">
            {t`Our platform is built with modern technology and best practices, offering a comprehensive suite of features designed to help your team work smarter and faster.`}
          </p>

          <IconContext.Provider value={{ size: 14, weight: "bold" }}>
            <div className="!mt-12 flex flex-wrap items-center gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  viewport={{ once: true }}
                  initial={{ opacity: 0, x: -50 }}
                  className={cn(featureLabel, feature.className)}
                  whileInView={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
                >
                  {feature.icon}
                  <h3>{feature.title}</h3>
                </motion.div>
              ))}

              <motion.p
                viewport={{ once: true }}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  transition: { delay: (features.length + 1) * 0.1 },
                }}
              >
                {t`and many more...`}
              </motion.p>
            </div>
          </IconContext.Provider>
        </div>
      </div>
    </section>
  );
};
