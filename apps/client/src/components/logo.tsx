import { useTheme } from "@my-saas/hooks";
import { cn } from "@my-saas/utils";

type Props = {
  size?: number;
  className?: string;
};

export const Logo = ({ size = 32, className }: Props) => {
  const { isDarkMode } = useTheme();

  let src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  switch (isDarkMode) {
    case false: {
      src = "/logo/light.svg";
      break;
    }
    case true: {
      src = "/logo/dark.svg";
      break;
    }
  }
 
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="My SaaS"
      className={cn("rounded-sm", className)}
    />
  );
};
