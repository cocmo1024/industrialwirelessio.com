export const SITE = {
  website: "https://industrialwirelessio.com/",
  author: "Editorial Team",
  profile: "",
  desc: "Independent English-language publication on wireless I/O, industrial telemetry, and field connectivity architecture.",
  title: "Industrial Wireless I/O",
  ogImage: "",
  contactEmail: "editor@industrialwirelessio.com",
  lightAndDarkMode: true,
  postPerIndex: 5,
  postPerPage: 12,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: false,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Shanghai",
} as const;
