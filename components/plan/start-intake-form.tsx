"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CHILD_AGE_BANDS,
  CHILD_AGE_BAND_LABELS,
  type ChildAgeBand,
} from "@/lib/db/schema-constants";
import { stashPlanText } from "@/lib/matching/plan-text-handoff";

type StartIntakeFormProps = {
  defaultMode: "nearby" | "needs";
};

export function StartIntakeForm({ defaultMode }: StartIntakeFormProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState(defaultMode);
  const [submitting, setSubmitting] = React.useState(false);
  const [ageBands, setAgeBands] = React.useState<ChildAgeBand[]>([]);

  function toggleAgeBand(band: ChildAgeBand) {
    setAgeBands((prev) =>
      prev.includes(band) ? prev.filter((b) => b !== band) : [...prev, band],
    );
  }

  return (
    <form
      // POST so a submit before hydration never puts the parent's text in the URL.
      method="post"
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        const form = new FormData(event.currentTarget);
        const params = new URLSearchParams();

        const postal = String(form.get("postal") ?? "").trim();
        if (postal) params.set("postal", postal);

        const radius = String(form.get("radius") ?? "15");
        params.set("radiusKm", radius);

        const category = String(form.get("category") ?? "").trim();
        if (category) params.set("categories", category);

        for (const band of ageBands) {
          params.append("childAgeBands", band);
        }

        const cost = String(form.get("cost") ?? "").trim();
        if (cost) params.set("costPreference", cost);

        // The free text never goes in the URL; it is handed to /plan via
        // sessionStorage. "Nearby" mode clears any earlier text.
        const text = mode === "needs" ? String(form.get("needs") ?? "") : "";
        const query = params.toString();
        stashPlanText(query, text);

        router.push(`/plan?${query}`);
      }}
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--ink)]">
          What are you looking for?
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant={mode === "nearby" ? "default" : "secondary"}
            className="rounded-[var(--radius-pill)] sm:flex-1"
            onClick={() => setMode("nearby")}
          >
            Support near me
          </Button>
          <Button
            type="button"
            variant={mode === "needs" ? "default" : "secondary"}
            className="rounded-[var(--radius-pill)] sm:flex-1"
            onClick={() => setMode("needs")}
          >
            Describe my situation
          </Button>
        </div>
      </fieldset>

      {mode === "nearby" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postal">Postal code (optional)</Label>
            <Input
              id="postal"
              name="postal"
              placeholder="T2Y 1A1"
              autoComplete="postal-code"
            />
            <p className="text-xs text-[var(--ink-muted)]">
              We store only a rough area, not your street address.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">How far can you travel?</Label>
            <select
              id="radius"
              name="radius"
              className="flex h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
              defaultValue="15"
            >
              <option value="5">Within 5 km</option>
              <option value="15">Within 15 km</option>
              <option value="25">Within 25 km</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="needs">What would help most right now?</Label>
          <Textarea
            id="needs"
            name="needs"
            maxLength={1000}
            placeholder="Example: I need after-school care and help understanding subsidy rules."
          />
          <p className="text-xs text-[var(--ink-muted)]">
            Do not include names, phone numbers, or your full address here.
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-[var(--radius-lg)] border-2 border-[var(--border)] bg-[var(--surface-muted)] p-5">
        <p className="text-sm font-medium text-[var(--ink)]">Optional filters</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              className="flex h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              defaultValue=""
            >
              <option value="">Any</option>
              <option value="childcare">Childcare</option>
              <option value="financial">Financial aid</option>
              <option value="food">Food</option>
              <option value="housing">Housing</option>
              <option value="activities">Activities</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Child age bands</Label>
            <div className="flex flex-wrap gap-2">
              {CHILD_AGE_BANDS.map((band) => {
                const selected = ageBands.includes(band);
                return (
                  <button
                    key={band}
                    type="button"
                    onClick={() => toggleAgeBand(band)}
                    aria-pressed={selected}
                    className={
                      selected
                        ? "rounded-[var(--radius-pill)] border-2 border-[var(--border-strong)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)]"
                        : "rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }
                  >
                    {CHILD_AGE_BAND_LABELS[band]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cost">Cost preference</Label>
            <select
              id="cost"
              name="cost"
              className="flex h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              defaultValue=""
            >
              <option value="">Any</option>
              <option value="free">Free</option>
              <option value="subsidized">Subsidized</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          size="lg"
          className="rounded-[var(--radius-pill)] sm:flex-1"
          disabled={submitting}
        >
          {submitting ? "Building plan..." : "See my support plan"}
        </Button>
      </div>
    </form>
  );
}
