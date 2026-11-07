"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { savePreferencesAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUDGET_BANDS,
  CHILD_AGE_BANDS,
  CHILD_AGE_BAND_LABELS,
  INTEREST_TAGS,
  INTEREST_TAG_LABELS,
  type BudgetBand,
  type ChildAgeBand,
  type InterestTag,
} from "@/lib/db/schema-constants";
import { cn } from "@/lib/utils";

export type PreferencesFormDefaults = {
  postalFsa: string;
  childAgeBands: ChildAgeBand[];
  interestTags: InterestTag[];
  childFirstNames: string[];
  openToMeetParents: boolean;
  budgetBand: BudgetBand | null;
  language: string;
};

type PreferencesFormProps = {
  defaults: PreferencesFormDefaults;
};

function ChipButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-2 border-[var(--border-strong)] bg-[var(--accent)] text-[var(--accent-fg)]"
          : "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]",
      )}
    >
      {children}
    </button>
  );
}

export function PreferencesForm({ defaults }: PreferencesFormProps) {
  const router = useRouter();
  const [postalFsa, setPostalFsa] = React.useState(defaults.postalFsa);
  const [childAgeBands, setChildAgeBands] = React.useState<ChildAgeBand[]>(
    defaults.childAgeBands,
  );
  const [interestTags, setInterestTags] = React.useState<InterestTag[]>(
    defaults.interestTags,
  );
  const [childFirstNames, setChildFirstNames] = React.useState(
    defaults.childFirstNames.join(", "),
  );
  const [openToMeetParents, setOpenToMeetParents] = React.useState(
    defaults.openToMeetParents,
  );
  const [budgetBand, setBudgetBand] = React.useState<BudgetBand | "">(
    defaults.budgetBand ?? "",
  );
  const [language, setLanguage] = React.useState(defaults.language || "en");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function toggleBand(band: ChildAgeBand) {
    setChildAgeBands((prev) =>
      prev.includes(band) ? prev.filter((b) => b !== band) : [...prev, band],
    );
  }

  function toggleTag(tag: InterestTag) {
    setInterestTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const names = childFirstNames
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    const result = await savePreferencesAction({
      postalFsa,
      childAgeBands,
      interestTags,
      childFirstNames: names,
      openToMeetParents,
      budgetBand: budgetBand === "" ? null : budgetBand,
      language,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Preferences saved.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--ink)]">
          Child age bands
        </legend>
        <p className="text-xs text-[var(--ink-muted)]">
          Pick every band that fits your kids. Used to improve search matches.
        </p>
        <div className="flex flex-wrap gap-2">
          {CHILD_AGE_BANDS.map((band) => (
            <ChipButton
              key={band}
              selected={childAgeBands.includes(band)}
              onClick={() => toggleBand(band)}
            >
              {CHILD_AGE_BAND_LABELS[band]}
            </ChipButton>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="childNames">Kids first names (optional, private)</Label>
        <Input
          id="childNames"
          value={childFirstNames}
          onChange={(e) => setChildFirstNames(e.target.value)}
          placeholder="Sam, Jordan"
          autoComplete="off"
        />
        <p className="text-xs text-[var(--ink-muted)]">
          Stored only on your account. Never sent to AI search.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--ink)]">
          Services you care about
        </legend>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map((tag) => (
            <ChipButton
              key={tag}
              selected={interestTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            >
              {INTEREST_TAG_LABELS[tag]}
            </ChipButton>
          ))}
        </div>
      </fieldset>

      <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
        <input
          id="meetParents"
          type="checkbox"
          checked={openToMeetParents}
          onChange={(e) => setOpenToMeetParents(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--accent)]"
        />
        <div>
          <Label htmlFor="meetParents" className="font-medium">
            Open to meeting similar parents
          </Label>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            When on, your plan can suggest the community board for peer
            connection. No DMs and no public profile matching.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="postalFsa">Area FSA (optional)</Label>
          <Input
            id="postalFsa"
            value={postalFsa}
            onChange={(e) => setPostalFsa(e.target.value)}
            placeholder="T2Y"
            maxLength={7}
            autoComplete="postal-code"
          />
          <p className="text-xs text-[var(--ink-muted)]">
            First 3 characters of a postal code only.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget band</Label>
          <select
            id="budget"
            value={budgetBand}
            onChange={(e) =>
              setBudgetBand(
                e.target.value === ""
                  ? ""
                  : (e.target.value as BudgetBand),
              )
            }
            className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          >
            <option value="">Any</option>
            {BUDGET_BANDS.map((band) => (
              <option key={band} value={band}>
                {band === "free"
                  ? "Free"
                  : band === "low"
                    ? "Low cost"
                    : "Any"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="language">Preferred language</Label>
          <Input
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en"
            maxLength={10}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-[var(--crisis-fg)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--accent)]" role="status">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="rounded-[var(--radius-pill)]"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
