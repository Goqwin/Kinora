"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCommunityPostAction } from "@/app/actions/community";
import type { CommunityPostCategory } from "@/lib/db/schema-constants";
import { COMMUNITY_POST_CATEGORIES } from "@/lib/db/schema-constants";

type CommunityPostFormProps = {
  resourceSlug?: string;
  disabled?: boolean;
};

export function CommunityPostForm({
  resourceSlug,
  disabled = false,
}: CommunityPostFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled) return;
        setPending(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        const rawCategory = String(form.get("category") ?? "other");
        const category = COMMUNITY_POST_CATEGORIES.includes(
          rawCategory as CommunityPostCategory,
        )
          ? (rawCategory as CommunityPostCategory)
          : "other";
        const result = await createCommunityPostAction({
          category,
          title: String(form.get("title") ?? ""),
          body: String(form.get("body") ?? ""),
          resourceSlug: resourceSlug ?? null,
        });
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push("/community");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue="childcare"
          className="flex h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        >
          <option value="childcare">Childcare</option>
          <option value="financial">Financial</option>
          <option value="housing">Housing</option>
          <option value="food">Food</option>
          <option value="health_family">Health and family</option>
          <option value="activities">Activities</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" maxLength={120} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Your question or story</Label>
        <Textarea id="body" name="body" maxLength={2000} required rows={6} />
      </div>
      {error ? (
        <p className="text-sm text-[var(--crisis-fg)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={disabled || pending}
        className="rounded-[var(--radius-pill)]"
      >
        {pending ? "Submitting..." : "Submit for review"}
      </Button>
      <p className="text-xs text-[var(--ink-muted)]">
        Posts are reviewed. If moderation is unsure, they stay pending.
      </p>
    </form>
  );
}
