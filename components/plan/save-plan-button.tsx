"use client";

import Link from "next/link";
import * as React from "react";

import { saveShownPlanAction, type ShownPlan } from "@/app/actions/plan";
import { Button } from "@/components/ui/button";

type SavePlanButtonProps = {
  authReady: boolean;
  dbReady: boolean;
  /** The plan on screen (structured data only, never the parent's text). */
  plan: ShownPlan;
};

export function SavePlanButton({
  authReady,
  dbReady,
  plan,
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
          const result = await saveShownPlanAction(plan);
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
