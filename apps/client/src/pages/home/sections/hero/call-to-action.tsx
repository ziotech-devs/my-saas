import { t } from "@lingui/macro";
import { Button } from "@my-saas/ui";
import { CompassIcon } from "@phosphor-icons/react";
import { Link } from "react-router";

import { useAuthStore } from "@/client/stores/auth";

export const HeroCTA = () => {
  const isLoggedIn = useAuthStore((state) => !!state.user);

  return (
    <>
      <Button asChild size="lg">
        <Link to={isLoggedIn ? "/dashboard" : "/auth/login"}>{t`Live Demo`}</Link>
      </Button>

      <Button asChild size="lg" variant="link">
        <a href="#features">
          <CompassIcon className="mr-3" />
          {t`Read docs`}
        </a>
      </Button>
    </>
  );
};
