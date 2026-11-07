"use client";

import * as React from "react";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CRISIS_INTRO, CRISIS_RESOURCES } from "@/lib/crisis";

type CrisisPanelProps = {
  trigger?: React.ReactNode;
};

export function CrisisPanel({ trigger }: CrisisPanelProps) {
  const defaultTrigger = (
    <Button variant="crisis" size="sm" type="button">
      Need help now?
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help right now</DialogTitle>
          <DialogDescription>{CRISIS_INTRO}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3 pt-1">
          {CRISIS_RESOURCES.map((resource) => (
            <li
              key={resource.name}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--canvas)] px-4 py-3"
            >
              <p className="text-sm font-semibold text-[var(--ink)]">
                {resource.name}
              </p>
              <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                {resource.detail}
              </p>
              {resource.href ? (
                <a
                  href={resource.href}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {resource.contact}
                </a>
              ) : (
                <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                  {resource.contact}
                </p>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
