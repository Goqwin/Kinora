"use client";

import { useState, useTransition } from "react";

import {
  reportCommunityContentAction,
  toggleHelpfulVoteAction,
} from "@/app/actions/community";
import { Button } from "@/components/ui/button";

type PostActionsProps = {
  postId: string;
  helpfulCount: number;
  signedIn: boolean;
};

export function PostActions({
  postId,
  helpfulCount,
  signedIn,
}: PostActionsProps) {
  const [count, setCount] = useState(helpfulCount);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="rounded-full"
        disabled={!signedIn || pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await toggleHelpfulVoteAction({
              targetType: "post",
              targetId: postId,
            });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setCount(result.helpfulCount);
          });
        }}
      >
        Helpful · {count}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-full"
        disabled={!signedIn || pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await reportCommunityContentAction({
              targetType: "post",
              targetId: postId,
              reason: "other",
            });
            setMessage(result.ok ? "Report sent. Thank you." : result.error);
          });
        }}
      >
        Report
      </Button>
      {message ? (
        <p className="w-full text-sm text-[var(--ink-muted)]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
