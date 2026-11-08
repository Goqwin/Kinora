"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setOpenToMeetParentsAction } from "@/app/actions/community";
import { Label } from "@/components/ui/label";

type CircleOptInProps = {
  signedIn: boolean;
  initialOpen: boolean;
};

export function CircleOptIn({ signedIn, initialOpen }: CircleOptInProps) {
  if (!signedIn) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        <a
          href="/auth/login?returnTo=/community"
          className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Sign in
        </a>{" "}
        to say you are open to hangouts, shopping trips, or company with nearby
        parents. No DMs and no public profile card.
      </p>
    );
  }

  return <CircleOptInControl key={String(initialOpen)} initialOpen={initialOpen} />;
}

function CircleOptInControl({ initialOpen }: { initialOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(initialOpen);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <input
          id="circleMeetParents"
          type="checkbox"
          checked={open}
          disabled={pending}
          onChange={async (event) => {
            const next = event.target.checked;
            setPending(true);
            setError(null);
            setOpen(next);
            const result = await setOpenToMeetParentsAction({
              openToMeetParents: next,
            });
            setPending(false);
            if (!result.ok) {
              setOpen(!next);
              setError(result.error);
              return;
            }
            router.refresh();
          }}
          className="mt-1 h-4 w-4 accent-[var(--accent)]"
        />
        <div>
          <Label htmlFor="circleMeetParents" className="font-medium">
            I am open to meet nearby parents
          </Label>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Adds you to the anonymous “open to hang out” count for your area.
            No names, no DMs, no public profile matching.
          </p>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-[var(--destructive)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
