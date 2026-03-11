import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "My SaaS Docs",
  tagline: "Production-ready SaaS boilerplate",
  url: "https://docs.example.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  favicon: "img/favicon.ico",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  organizationName: "my-saas",
  projectName: "my-saas",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "My SaaS",
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/ziotech-devs/my-saas",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} My SaaS`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
