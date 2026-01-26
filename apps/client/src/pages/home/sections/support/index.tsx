import { t } from "@lingui/macro";
import {
  CreditCardIcon,
  LockIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { IconContext } from "@phosphor-icons/react";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};



export const SupportSection = () => {
  const features: Feature[] = [
    {
      icon: <LockIcon />,
      title: t`Authentication`,
      description: t`Secure user authentication with multiple sign-in options including email, OAuth providers, and two-factor authentication.`,
    },
    {
      icon: <CreditCardIcon />,
      title: t`Payments`,
      description: t`Integrated payment processing with support for subscriptions, one-time payments, and multiple payment methods.`,
    },
    {
      icon: <ShieldCheckIcon />,
      title: t`Security`,
      description: t`Enterprise-grade security with encryption, role-based access control, and compliance with industry standards.`,
    },
    {
      icon: <UserCircleIcon />,
      title: t`User Management`,
      description: t`Comprehensive user management with profiles, teams, permissions, and activity tracking.`,
    },
  ];

  return (
    <section
      id="main-features"
      className="relative space-y-12 bg-secondary-accent py-24 text-primary sm:py-32"
    >
      <div className="container space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold">{t`Built-in Core Features`}</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed">
            {t`Everything you need to launch and scale your SaaS product, built right in. No need to integrate multiple services.`}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="space-y-4 rounded-lg bg-background p-6 shadow-sm"
            >
              <IconContext.Provider value={{ size: 32, weight: "bold" }}>
                <div className="text-primary">{feature.icon}</div>
              </IconContext.Provider>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
