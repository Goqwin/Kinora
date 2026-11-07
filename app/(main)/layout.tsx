import { AppShell } from "@/components/layout/app-shell";

/** Catalog, plan filters, and optional auth may block during prerender (Cache Components). */
export const instant = false;

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
