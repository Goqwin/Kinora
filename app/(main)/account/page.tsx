import { Suspense } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { MyPostsList } from "@/components/account/my-posts-list";
import {
  PreferencesForm,
  type PreferencesFormDefaults,
} from "@/components/account/preferences-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalUser, isAuthConfigured } from "@/lib/auth";
import { LOGOUT_HREF, loginHref, safeReturnPath } from "@/lib/auth/paths";
import { isDatabaseConfigured } from "@/lib/db";
import {
  BUDGET_BANDS,
  CHILD_AGE_BANDS,
  INTEREST_TAGS,
  type BudgetBand,
  type ChildAgeBand,
  type InterestTag,
} from "@/lib/db/schema-constants";
import { listCommunityPostsByAuthor } from "@/lib/db/queries/community";
import { getPreferencesByUserId } from "@/lib/db/queries/preferences";

export const metadata = {
  title: "Account",
};

/** Auth session reads cookies — block this route under Cache Components. */
export const instant = false;

function asChildAgeBands(values: string[] | null | undefined): ChildAgeBand[] {
  if (!values) return [];
  return values.filter((v): v is ChildAgeBand =>
    (CHILD_AGE_BANDS as readonly string[]).includes(v),
  );
}

function asInterestTags(values: string[] | null | undefined): InterestTag[] {
  if (!values) return [];
  return values.filter((v): v is InterestTag =>
    (INTEREST_TAGS as readonly string[]).includes(v),
  );
}

function asBudgetBand(value: string | null | undefined): BudgetBand | null {
  if (!value) return null;
  return (BUDGET_BANDS as readonly string[]).includes(value)
    ? (value as BudgetBand)
    : null;
}

function AccountFallback() {
  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Account"
        title="Your account"
        description="Loading your account…"
      />
      <div className="mt-8 h-40 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)]" />
    </PageShell>
  );
}

type AccountSearchParams = Promise<{ returnTo?: string | string[] }>;

async function AccountContent({ searchParams }: { searchParams: AccountSearchParams }) {
  const { returnTo } = await searchParams;
  const returnPath = safeReturnPath(typeof returnTo === "string" ? returnTo : undefined);
  const authReady = isAuthConfigured();
  const dbReady = isDatabaseConfigured();
  const user = authReady ? await getOptionalUser() : null;

  let prefsDefaults: PreferencesFormDefaults = {
    postalFsa: "",
    childAgeBands: [],
    interestTags: [],
    childFirstNames: [],
    openToMeetParents: false,
    budgetBand: null,
    language: "en",
  };
  let myPosts: Awaited<ReturnType<typeof listCommunityPostsByAuthor>> = [];

  if (user && dbReady && /^[0-9a-f-]{36}$/i.test(user.id)) {
    try {
      const prefs = await getPreferencesByUserId(user.id);
      if (prefs) {
        prefsDefaults = {
          postalFsa: prefs.postalFsa ?? "",
          childAgeBands: asChildAgeBands(prefs.childAgeBands),
          interestTags: asInterestTags(
            prefs.interestTags?.length
              ? prefs.interestTags
              : prefs.categories,
          ),
          childFirstNames: prefs.childFirstNames ?? [],
          openToMeetParents: prefs.openToMeetParents,
          budgetBand: asBudgetBand(prefs.budgetBand),
          language: prefs.language || "en",
        };
      }
      myPosts = await listCommunityPostsByAuthor(user.id);
    } catch {
      /* DB may be missing new columns until migration runs */
    }
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Account"
        title="Your account"
        description="Login is optional until you save a plan or post in the community."
      />

      <div className="mt-8 space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--ink-muted)]">
            <UserRound className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-[var(--ink)]">
              {user
                ? `Signed in as ${user.displayName ?? user.email ?? "parent"}`
                : "You are browsing as a guest"}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {user
                ? "Update how Kinora matches supports for your kids. Your posts stay private on this page."
                : authReady
                  ? "Sign in when you are ready to save preferences or join the community board."
                  : "Add Auth0 environment variables to enable sign-in."}
            </p>
            {user?.email ? (
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Account email is private and never shown on community posts.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Button
              asChild
              variant="secondary"
              className="rounded-full sm:flex-1"
            >
              <a href={LOGOUT_HREF}>Sign out</a>
            </Button>
          ) : (
            <Button
              asChild={authReady}
              disabled={!authReady}
              className="rounded-full sm:flex-1"
              aria-disabled={!authReady}
            >
              {authReady ? (
                <a href={loginHref(returnPath)}>Sign in</a>
              ) : (
                <span>Sign in</span>
              )}
            </Button>
          )}
          <Button
            asChild
            variant="secondary"
            className="rounded-full sm:flex-1"
          >
            <Link href="/start">Continue to search</Link>
          </Button>
        </div>
      </div>

      {user ? (
        <>
          <section className="mt-10 space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
              Preferences
            </h2>
            {!dbReady ? (
              <p className="text-sm text-[var(--ink-muted)]">
                Connect the database to save preferences.
              </p>
            ) : (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
                <PreferencesForm defaults={prefsDefaults} />
              </div>
            )}
          </section>

          <section className="mt-10 space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                  My posts
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Private to you. Includes pending and published posts.
                </p>
              </div>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="rounded-full"
              >
                <Link href="/community/new">New post</Link>
              </Button>
            </div>
            {dbReady ? (
              <MyPostsList posts={myPosts} />
            ) : (
              <p className="text-sm text-[var(--ink-muted)]">
                Connect the database to see your posts.
              </p>
            )}
          </section>
        </>
      ) : null}
    </PageShell>
  );
}

export default function AccountPage({ searchParams }: { searchParams: AccountSearchParams }) {
  return (
    <Suspense fallback={<AccountFallback />}>
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}
