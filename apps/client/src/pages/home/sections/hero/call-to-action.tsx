import { t } from "@lingui/macro";
import { Button } from "@my-saas/ui";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { Link } from "react-router";

import { useAuthStore } from "@/client/stores/auth";

export const HeroCTA = () => {
  const isLoggedIn = useAuthStore((state) => !!state.user);

  return (
    <>
      <Button asChild size="lg">
        <Link to={isLoggedIn ? "/dashboard" : "/auth/login"}>{isLoggedIn ? t`Dashboard` : t`Explore`}</Link>
      </Button>

      <Button asChild size="lg" variant="link">
        <a href="https://github.com/ziotech-devs/my-saas" target="_blank" rel="noopener noreferrer">
          <GithubLogoIcon className="mr-3" />
          {t`Rate us on GitHub`}
        </a>
      </Button>
    </>
  );
};
