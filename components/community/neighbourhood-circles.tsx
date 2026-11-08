import Link from "next/link";

import { CircleOptIn } from "@/components/community/circle-opt-in";
import { ageBandDisplayLabel } from "@/lib/community/circle-privacy";
import type { NeighbourhoodCircle } from "@/lib/db/queries/neighbourhood-circles";
import type { CommunityPostListItem } from "@/lib/db/queries/community";
import type { CatalogResource } from "@/lib/resources/types";

type NeighbourhoodCirclesProps = {
  activeCircle: NeighbourhoodCircle | null;
  topCircles: NeighbourhoodCircle[];
  hangoutPosts: CommunityPostListItem[];
  peerGroups: CatalogResource[];
  signedIn: boolean;
  viewerOpenToMeet: boolean;
  viewerFsa: string | null;
};

export function NeighbourhoodCircles({
  activeCircle,
  topCircles,
  hangoutPosts,
  peerGroups,
  signedIn,
  viewerOpenToMeet,
  viewerFsa,
}: NeighbourhoodCirclesProps) {
  return (
    <section className="mt-10 space-y-8" aria-labelledby="circles-heading">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
          Neighbourhood circles
        </p>
        <h2
          id="circles-heading"
          className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]"
        >
          Parents near you
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
          Anonymous counts from parents who shared an area and kid ages. We
          never show names, emails, or exact locations here.
        </p>
      </div>

      {activeCircle && activeCircle.parentCount > 0 ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {viewerFsa === activeCircle.fsa ? "Your circle" : "This circle"}
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            About {activeCircle.parentCount} parents near {activeCircle.label}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {activeCircle.fsa}
            {activeCircle.openToMeetCount > 0
              ? ` · ${activeCircle.openToMeetCount} open to hang out, shop, or share company`
              : null}
          </p>

          {activeCircle.ageBands.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {activeCircle.ageBands.map((band) => (
                <li
                  key={band.band}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--ink)]"
                >
                  Kids {ageBandDisplayLabel(band.band)} · {band.count}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Age details stay hidden until enough parents share the same band.
            </p>
          )}

          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <CircleOptIn signedIn={signedIn} initialOpen={viewerOpenToMeet} />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
            Pick a neighbourhood to see your circle
          </p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Set your area FSA in Account, or choose a city pulse area below.
            Counts grow as more parents share prefs.
          </p>
          <div className="mt-5">
            <CircleOptIn signedIn={signedIn} initialOpen={viewerOpenToMeet} />
          </div>
        </div>
      )}

      {topCircles.length > 0 ? (
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
            City pulse
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Busiest areas by parents who shared a Calgary FSA.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {topCircles.map((circle) => {
              const active = activeCircle?.fsa === circle.fsa;
              return (
                <li key={circle.fsa}>
                  <Link
                    href={`/community?fsa=${encodeURIComponent(circle.fsa)}`}
                    className={`block rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                      active
                        ? "border-[var(--accent)] bg-[var(--surface-muted)]"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {circle.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {circle.fsa} · {circle.parentCount} parents
                      {circle.openToMeetCount > 0
                        ? ` · ${circle.openToMeetCount} open to meet`
                        : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {hangoutPosts.length > 0 ? (
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
            Hangouts near parents like you
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Community opinions about coffee walks, shopping buddies, and peer
            company — not verified listings.
          </p>
          <ul className="mt-4 space-y-3">
            {hangoutPosts.slice(0, 4).map((post) => (
              <li key={post.id}>
                <Link
                  href={`/community/${post.id}`}
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <p className="font-medium text-[var(--ink)]">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-muted)]">
                    {post.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {peerGroups.length > 0 ? (
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
            Peer groups nearby
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Verified community resources close to this circle.
          </p>
          <ul className="mt-4 space-y-3">
            {peerGroups.map((resource) => (
              <li key={resource.slug}>
                <Link
                  href={`/resources/${resource.slug}`}
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <p className="font-medium text-[var(--ink)]">{resource.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-muted)]">
                    {resource.description}
                  </p>
                  {typeof resource.distanceKm === "number" ? (
                    <p className="mt-2 text-xs text-[var(--ink-muted)]">
                      About {resource.distanceKm.toFixed(1)} km away
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
