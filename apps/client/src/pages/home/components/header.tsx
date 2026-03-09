import { t } from "@lingui/macro";
import { buttonVariants } from "@my-saas/ui";
import { cn } from "@my-saas/utils";
import { motion } from "framer-motion";
import { Link } from "react-router";

import { Logo } from "@/client/components/logo";
import { useAuthStore } from "@/client/stores/auth";

import { DonationBanner } from "./donation-banner";

export const Header = () => {
  const isLoggedIn = useAuthStore((state) => !!state.user);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-20"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
    >
      <DonationBanner />

      <div className="bg-gradient-to-b from-background to-transparent py-3">
        <div className="container flex items-center justify-between">
          <Link to="/">
            <Logo size={48} />
          </Link>

          <nav className="flex items-center gap-x-1">
            <a
              href="https://docs.ziotech.dev"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              {t`Docs`}
            </a>
            <a
              href="https://ziotech.dev/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              {t`Contact Us`}
            </a>
            <Link
              to={isLoggedIn ? "/dashboard" : "/auth/register"}
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              {isLoggedIn ? t`Dashboard` : t`Sign Up`}
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};
