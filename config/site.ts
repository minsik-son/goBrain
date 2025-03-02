import type { NavItem } from "@/types/nav"

interface SiteConfig {
  name: string
  description: string
  mainNav: NavItem[]
}

export const siteConfig: SiteConfig = {
  name: "AI Translator",
  description: "AI-powered translation service for multiple languages",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Pricing",
      href: "/pricing",
    },
    {
      title: "About Us",
      href: "/about",
    },
  ],
}

