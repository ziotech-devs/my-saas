import { t, Trans } from "@lingui/macro";
import { cn } from "@my-saas/utils";

type Props = {
  className?: string;
};

export const Copyright = ({ className }: Props) => (
  <div
    className={cn(
      "prose prose-sm prose-zinc flex max-w-none flex-col gap-y-1 text-xs opacity-40 dark:prose-invert",
      className,
    )}
  >
    <span>
      <Trans>
        © {new Date().getFullYear()} My SaaS. All rights reserved.
      </Trans>
    </span>
    <span>
      <Trans>
        Built with modern technology and best practices.
      </Trans>
    </span>

    <span className="mt-4">
      {t`Platform`} {"v" + appVersion}
    </span>
  </div>
);
