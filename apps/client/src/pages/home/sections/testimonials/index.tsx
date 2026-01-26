/* eslint-disable lingui/text-restrictions */
/* eslint-disable lingui/no-unlocalized-strings */

import { t, Trans } from "@lingui/macro";
import { cn } from "@my-saas/utils";
import { QuotesIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const email = "hello@example.com";

type Testimonial = {
  quote: string;
  name: string;
};

const testimonials: Testimonial[][] = [
  [
    {
      name: "Sarah Chen",
      quote:
        "This platform has completely transformed how our team works. The intuitive interface and powerful features have saved us countless hours every week. Highly recommended!",
    },
    {
      name: "Michael Rodriguez",
      quote:
        "We've tried several solutions, but this one stands out. The ease of use combined with robust functionality makes it perfect for teams of any size. Our productivity has increased significantly.",
    },
    {
      name: "Emily Johnson",
      quote:
        "The value we get from this platform is incredible. It's streamlined our workflow and eliminated so many manual processes. Best investment we've made this year.",
    },
  ],
  [
    {
      name: "David Kim",
      quote:
        "Implementation was seamless, and our team was up and running in no time. The support team is responsive, and the platform continues to exceed our expectations. Game changer for our business.",
    },
    {
      name: "Lisa Thompson",
      quote:
        "As someone who isn't very technical, I was worried about the learning curve. But the platform is so intuitive that I was productive from day one. It's made my job so much easier.",
    },
  ],
  [
    {
      name: "James Wilson",
      quote:
        "The ROI has been immediate. We've seen measurable improvements in efficiency and collaboration. This platform has become essential to our daily operations.",
    },
    {
      name: "Maria Garcia",
      quote:
        "What I love most is how customizable it is. We've been able to adapt it perfectly to our specific needs. The flexibility combined with great support makes it a winner.",
    },
    {
      name: "Robert Taylor",
      quote:
        "Clean interface, powerful features, and reliable performance. Everything just works as expected. Our team can't imagine going back to our old way of working.",
    },
  ],
];

export const TestimonialsSection = () => (
  <section id="testimonials" className="container relative space-y-12 py-24 sm:py-32">
    <div className="space-y-6 text-center">
      <h1 className="text-4xl font-bold">{t`Testimonials`}</h1>
      <p className="mx-auto max-w-2xl leading-relaxed">
        <Trans>
          Don't just take our word for it. Here's what our customers have to say about their experience
          with our platform. Have questions or feedback? Reach out to us at{" "}
          <a href={`mailto:${email}`} className="underline">
            {email}
          </a>
          .
        </Trans>
      </p>
    </div>

    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-y-0">
      {testimonials.map((columnGroup, groupIndex) => (
        <div key={groupIndex} className="space-y-8">
          {columnGroup.map((testimonial, index) => (
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0, transition: { delay: index * 0.25 } }}
              className={cn(
                "relative overflow-hidden rounded-lg bg-secondary-accent p-5 text-primary shadow-lg",
                index > 0 && "hidden lg:block",
              )}
            >
              <QuotesIcon size={64} className="absolute -right-3 bottom-0 opacity-20" />
              <blockquote className="italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 font-medium">{testimonial.name}</figcaption>
            </motion.figure>
          ))}
        </div>
      ))}
    </div>
  </section>
);
