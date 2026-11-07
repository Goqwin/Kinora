import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Narrow for forms and reading; wide for catalogs. */
  width?: "narrow" | "default" | "wide";
};

const WIDTH = {
  narrow: "max-w-2xl",
  default: "max-w-3xl",
  wide: "max-w-6xl",
} as const;

/** Shared interior page frame aligned with the Kinora landing language. */
export function PageShell({
  children,
  className,
  width = "default",
}: PageShellProps) {
  return (
    <main
      className={cn(
        "relative mx-auto w-full flex-1 px-4 py-10 sm:px-6 sm:py-14",
        WIDTH[width],
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-40 bg-[radial-gradient(ellipse_at_top,rgb(13_148_136/0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(45_212_191/0.1),transparent_70%)]"
      />
      <div className="relative">{children}</div>
    </main>
  );
}
