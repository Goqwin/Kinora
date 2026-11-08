"use client";

import Link from "next/link";
import * as React from "react";

import { toggleSavedResourceAction } from "@/app/actions/saved";
import { Button } from "@/components/ui/button";

type SaveResourceButtonProps = {
  slug: string;
  authReady: boolean;
  initialSaved: boolean;
  dbReady: boolean;
};

export function SaveResourceButton({
  slug,
  authReady,
  initialSaved,
  dbReady,
}: SaveResourceButtonProps) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!authReady) {
    return (
      <Button asChild variant="secondary" className="rounded-[var(--radius-pill)]">
        <Link href="/account">Sign in to save</Link>
      </Button>
    );
  }

  if (!dbReady) {
    return (
      <Button disabled aria-disabled="true" variant="secondary">
        Save (database offline)
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant={saved ? "secondary" : "default"}
        className="rounded-[var(--radius-pill)]"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await toggleSavedResourceAction(slug, saved);
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSaved(result.saved);
        }}
      >
        {pending ? "Saving…" : saved ? "Saved" : "Save resource"}
      </Button>
      {error ? (
        <p className="text-xs text-[var(--crisis-fg)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
