import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="break-words font-[family-name:var(--font-display)] text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--ink)] sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-[1.05rem]">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
