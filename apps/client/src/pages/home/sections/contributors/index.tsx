import { t } from "@lingui/macro";
import { buttonVariants } from "@my-saas/ui";
import { cn } from "@my-saas/utils";
import { motion } from "framer-motion";

export const ContributorsSection = () => {
  return (
    <section id="cta" className="container relative space-y-12 py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-8 text-center"
      >
        <h1 className="text-4xl font-bold sm:text-5xl">{t`Ready to get started?`}</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed">
          {t`Join thousands of teams already using our platform to streamline their workflow and boost productivity. Start your free trial today - no credit card required.`}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <motion.a
            href="#signup"
            className={cn(buttonVariants({ size: "lg" }))}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t`Start Free Trial`}
          </motion.a>
          <motion.a
            href="#contact"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t`Contact Sales`}
          </motion.a>
        </div>

        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t`Questions? Our team is here to help. Reach out anytime and we'll get back to you within 24 hours.`}
        </p>
      </motion.div>
    </section>
  );
};
