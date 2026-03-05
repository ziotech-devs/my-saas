import { TwoFactorDialog } from "../pages/dashboard/settings/_dialogs/two-factor";

type Props = {
  children: React.ReactNode;
};

export const DialogProvider = ({ children }: Props) => {
  return (
    <>
      {children}

      <div id="dialog-root">
        <TwoFactorDialog />
      </div>
    </>
  );
};
