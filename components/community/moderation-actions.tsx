"use client";

import { useTransition } from "react";

import { moderateCommunityPostAction } from "@/app/actions/community";
import { Button } from "@/components/ui/button";

type ModerationActionsProps = {
  postId: string;
};

export function ModerationActions({ postId }: ModerationActionsProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await moderateCommunityPostAction({
              postId,
              decision: "publish",
            });
          });
        }}
      >
        Publish
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="rounded-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await moderateCommunityPostAction({
              postId,
              decision: "remove",
            });
          });
        }}
      >
        Remove
      </Button>
    </div>
  );
}
