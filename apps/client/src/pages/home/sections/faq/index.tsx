/* eslint-disable lingui/text-restrictions */
/* eslint-disable lingui/no-unlocalized-strings */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@my-saas/ui";

// What is your pricing model?
const Question1 = () => (
  <AccordionItem value="1">
    <AccordionTrigger className="text-left leading-relaxed">
      What is your pricing model?
    </AccordionTrigger>
    <AccordionContent className="prose max-w-none dark:prose-invert">
      <p>
        We offer flexible pricing plans to suit teams of all sizes. Our plans include a free tier
        with basic features, plus several paid tiers with advanced functionality. All paid plans
        include a 14-day free trial, so you can explore all features risk-free.
      </p>
      <p>
        Pricing is based on the number of users and includes access to all core features like
        authentication, payments, user management, and API access. Enterprise plans are available
        for larger organizations with custom requirements.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// How secure is my data?
const Question2 = () => (
  <AccordionItem value="2">
    <AccordionTrigger className="text-left leading-relaxed">
      How secure is my data?
    </AccordionTrigger>
    <AccordionContent className="prose max-w-none dark:prose-invert">
      <p>
        Security is our top priority. We use industry-standard encryption for data in transit and at
        rest. All sensitive information is encrypted using AES-256 encryption, and we follow SOC 2
        compliance standards.
      </p>
      <p>
        We offer two-factor authentication (2FA) for all user accounts, role-based access control
        for team management, and regular security audits. Your data is stored in secure, compliant
        data centers with regular backups and disaster recovery procedures in place.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// Can I integrate with other tools?
const Question3 = () => (
  <AccordionItem value="3">
    <AccordionTrigger className="text-left leading-relaxed">
      Can I integrate with other tools?
    </AccordionTrigger>
    <AccordionContent className="prose max-w-none dark:prose-invert">
      <p>
        Yes! We provide a comprehensive REST API that allows you to integrate with virtually any
        tool or service. Our API is well-documented and includes webhooks for real-time
        notifications.
      </p>
      <p>
        We also offer native integrations with popular services like GitHub, Google Workspace,
        Slack, and more. If you need a custom integration, our team can help you set it up or you
        can use our API to build your own.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// What payment methods do you accept?
const Question4 = () => (
  <AccordionItem value="4">
    <AccordionTrigger className="text-left leading-relaxed">
      What payment methods do you accept?
    </AccordionTrigger>
    <AccordionContent className="prose max-w-none dark:prose-invert">
      <p>
        We accept all major credit cards (Visa, Mastercard, American Express), as well as ACH
        transfers for annual plans. All payments are processed securely through our payment
        processor, which is PCI DSS compliant.
      </p>
      <p>
        For enterprise customers, we also accept wire transfers and can provide custom invoicing
        arrangements. All subscriptions can be canceled at any time, and you'll retain access
        until the end of your billing period.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// What kind of support do you offer?
const Question5 = () => (
  <AccordionItem value="5">
    <AccordionTrigger className="text-left leading-relaxed">
      What kind of support do you offer?
    </AccordionTrigger>
    <AccordionContent className="prose max-w-none dark:prose-invert">
      <p>
        All plans include email support with a response time of 24-48 hours. Paid plans include
        priority support with faster response times, and enterprise plans include dedicated account
        management and phone support.
      </p>
      <p>
        We also maintain comprehensive documentation, video tutorials, and a knowledge base to help
        you get the most out of our platform. Our community forum is a great place to connect with
        other users and share best practices.
      </p>
    </AccordionContent>
  </AccordionItem>
);

export const FAQSection = () => (
  <section id="faq" className="container relative py-24 sm:py-32">
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>

        <p className="text-base leading-loose">
          Have questions? We've got answers. Here are some of the most common questions we receive
          about our platform.
        </p>

        <p className="text-sm leading-loose">
          Can't find what you're looking for?{" "}
          <a href="#contact" className="underline">
            Contact our support team
          </a>{" "}
          and we'll be happy to help.
        </p>
      </div>

      <div className="col-span-2">
        <Accordion collapsible type="single">
          <Question1 />
          <Question2 />
          <Question3 />
          <Question4 />
          <Question5 />
        </Accordion>
      </div>
    </div>
  </section>
);
