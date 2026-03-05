import { t } from "@lingui/macro";
import { Separator } from "@my-saas/ui";
import { Link } from "react-router";

import { Copyright } from "@/client/components/copyright";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";

export const Footer = () => (
  <footer className="bg-background">
    <Separator />

    <div className="container grid py-12 sm:grid-cols-3 lg:grid-cols-4">
      <div className="flex flex-col gap-y-2">
        <Logo size={96} className="-ml-2" />

        <h2 className="text-xl font-medium">{t`Your SaaS Platform`}</h2>

        <p className="prose prose-sm prose-zinc leading-relaxed opacity-60 dark:prose-invert">
          {t`Empowering teams with powerful tools to streamline workflows and boost productivity.`}
        </p>

        <Copyright className="mt-6" />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t`Product`}</h3>
        <div className="flex flex-col gap-y-2">
          <Link to="/#features" className="text-sm text-muted-foreground hover:text-foreground">
            {t`Features`}
          </Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
            {t`Pricing`}
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t`Company`}</h3>
        <div className="flex flex-col gap-y-2">
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
            {t`About`}
          </Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
            {t`Contact`}
          </Link>
          <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
            {t`Privacy Policy`}
          </Link>
          <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            {t`Terms of Service`}
          </Link>
        </div>
      </div>

      <div className="relative col-start-4 flex flex-col items-end justify-end">
        <div className="mb-14 space-y-4 text-right">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t`Resources`}</h3>
            <div className="flex flex-col gap-y-2">
              <Link to="/#faq" className="text-sm text-muted-foreground hover:text-foreground">
                {t`FAQ`}
              </Link>
              <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                {t`Documentation`}
              </Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground">
                {t`Support`}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 lg:space-x-2">
          <LocaleSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </div>
  </footer>
);
