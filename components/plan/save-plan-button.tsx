"use client";

import Link from "next/link";
import * as React from "react";

import { persistPlanFromSearchAction } from "@/app/actions/plan";
import { Button } from "@/components/ui/button";

type SavePlanButtonProps = {
  authReady: boolean;
  dbReady: boolean;
  searchParams: Record<string, string | undefined>;
};

export function SavePlanButton({
  authReady,
  dbReady,
  searchParams,
}: SavePlanButtonProps) {
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!authReady) {
    return (
      <Button asChild variant="secondary" className="rounded-[var(--radius-pill)]">
        <Link href="/account">Sign in to save plan</Link>
      </Button>
    );
  }

  if (!dbReady) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        className="rounded-[var(--radius-pill)]"
        disabled={pending || done}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await persistPlanFromSearchAction({
            text: searchParams.text,
            postal: searchParams.postal,
            radiusKm: searchParams.radiusKm
              ? Number(searchParams.radiusKm)
              : undefined,
            categories: searchParams.categories,
            childAgeYears: searchParams.childAgeYears
              ? Number(searchParams.childAgeYears)
              : null,
            costPreference:
              searchParams.costPreference === "free" ||
              searchParams.costPreference === "subsidized"
                ? searchParams.costPreference
                : null,
          });
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setDone(true);
        }}
      >
        {done ? "Plan saved" : pending ? "Saving…" : "Save this plan"}
      </Button>
      {error ? (
        <p className="text-xs text-[var(--crisis-fg)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
