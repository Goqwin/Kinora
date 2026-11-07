"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  getPublicMapboxToken,
  isLikelyValidMapboxPublicToken,
  isMapboxConfigured,
  MIN_MAPBOX_PUBLIC_TOKEN_LENGTH,
} from "@/lib/mapbox/config";
import { cn } from "@/lib/utils";

import type { ResourceMapProps } from "./ResourceMap";

const MapPlaceholder = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "grid min-h-[min(70vh,28rem)] place-items-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]",
      className,
    )}
    role="region"
    aria-label="Map"
  >
    {children}
  </div>
);

const ResourceMap = dynamic(() => import("./ResourceMap"), {
  ssr: false,
  loading: () => <MapPlaceholder>Loading map…</MapPlaceholder>,
});

export function LazyResourceMap(props: ResourceMapProps) {
  const [visible, setVisible] = useState(false);
  const token = getPublicMapboxToken();
  const configured = isMapboxConfigured();
  const tokenPresent = Boolean(token?.trim());
  const tokenInvalid = tokenPresent && !isLikelyValidMapboxPublicToken(token);

  if (!configured) {
    return (
      <MapPlaceholder>
        {tokenInvalid ? (
          <p className="max-w-sm">
            Your <code className="text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> looks
            incomplete or invalid (public tokens are usually at least{" "}
            {MIN_MAPBOX_PUBLIC_TOKEN_LENGTH} characters). Paste the full token
            from Mapbox into <code className="text-xs">.env.local</code> and
            restart the dev server. List results still work without a map.
          </p>
        ) : (
          <p>
            Map view needs a valid{" "}
            <code className="text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
            <code className="text-xs">.env.local</code>. List results still work
            without it.
          </p>
        )}
      </MapPlaceholder>
    );
  }

  if (!visible) {
    return (
      <MapPlaceholder className="bg-gradient-to-br from-[var(--surface-muted)] to-[var(--trust-muted)]">
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-brutal-sm)] hover:bg-[var(--canvas)]"
        >
          Open immersive map
        </button>
        <p className="mt-3 max-w-xs text-xs leading-relaxed">
          Full Calgary view with 3D buildings, color-coded pins, and full-screen
          mode. Loads on demand.
        </p>
      </MapPlaceholder>
    );
  }

  return (
    <div className="h-[min(78vh,40rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-md)] lg:h-[min(82vh,48rem)]">
      <ResourceMap {...props} />
    </div>
  );
}
