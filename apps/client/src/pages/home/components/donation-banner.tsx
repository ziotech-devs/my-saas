/* eslint-disable lingui/no-unlocalized-strings */

import { StarIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export const DonationBanner = () => (
  <motion.a
    href="#pricing"
    whileHover={{ height: 48 }}
    initial={{ opacity: 0, y: -50, height: 32 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
    className="hidden w-screen items-center justify-center gap-x-2 bg-zinc-800 font-sans text-xs font-bold leading-relaxed text-zinc-50 lg:flex"
  >
    <StarIcon weight="bold" size={14} className="shrink-0" />
    <span>
      Unlock premium features and take your productivity to the next level. Start your free trial today.
    </span>
  </motion.a>
);
