import { AppShell } from "@/components/layout/app-shell";

/** Home uses HeroNav instead of SiteHeader. */
export const instant = false;

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell showHeader={false}>{children}</AppShell>;
}
