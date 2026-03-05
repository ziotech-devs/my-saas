import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "getting-started",
    "architecture",
    {
      type: "category",
      label: "Features",
      items: [
        "features/auth",
        "features/billing",
        "features/feature-flags",
        "features/mail",
        "features/storage",
        "features/i18n",
        "features/jobs",
        "features/admin",
        "features/ai-agents",
      ],
    },
    {
      type: "category",
      label: "Libraries",
      items: [
        "libraries/ui",
        "libraries/hooks",
        "libraries/dto",
        "libraries/utils",
      ],
    },
    {
      type: "category",
      label: "Deployment",
      items: [
        "deployment/cloud",
        "deployment/vps",
        "deployment/docker",
      ],
    },
    "contributing",
  ],
};

export default sidebars;
