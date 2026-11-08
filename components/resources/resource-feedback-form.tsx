"use client";

import * as React from "react";

import { submitResourceFeedbackAction } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RESOURCE_FEEDBACK_TYPES,
  type ResourceFeedbackType,
} from "@/lib/db/schema-constants";

type ResourceFeedbackFormProps = {
  resourceSlug: string;
  disabled?: boolean;
};

export function ResourceFeedbackForm({
  resourceSlug,
  disabled = false,
}: ResourceFeedbackFormProps) {
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  if (done) {
    return (
      <p className="text-sm text-[var(--ink-muted)]" role="status">
        Thanks. A moderator can review this flag. We do not change verified text
        automatically.
      </p>
    );
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled) return;
        setPending(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        const rawType = String(form.get("type") ?? "other");
        const type = RESOURCE_FEEDBACK_TYPES.includes(
          rawType as ResourceFeedbackType,
        )
          ? (rawType as ResourceFeedbackType)
          : "other";
        const result = await submitResourceFeedbackAction({
          resourceSlug,
          type,
          note: String(form.get("note") ?? ""),
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setDone(true);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="feedback-type">What looks wrong?</Label>
        <select
          id="feedback-type"
          name="type"
          defaultValue="outdated"
          className="flex h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        >
          <option value="outdated">May be outdated</option>
          <option value="wrong_info">Wrong details</option>
          <option value="closed">Seems closed</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-note">Short note (optional)</Label>
        <Textarea
          id="feedback-note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder="No names or phone numbers, please."
        />
      </div>
      {error ? (
        <p className="text-sm text-[var(--crisis-fg)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="secondary"
        disabled={disabled || pending}
        className="rounded-[var(--radius-pill)]"
      >
        {pending ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
