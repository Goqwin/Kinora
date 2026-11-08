import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type AppShellProps = {
  children: React.ReactNode;
  /** When false, HeroNav on the home page owns chrome. */
  showHeader?: boolean;
};

export function AppShell({ children, showHeader = true }: AppShellProps) {
  return (
    <>
      {showHeader ? <SiteHeader /> : null}
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </>
  );
}
