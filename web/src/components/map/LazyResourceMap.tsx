"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { ResourceMapProps } from "./ResourceMap";

const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <div className="grid h-full place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600">{children}</div>
);

const ResourceMap = dynamic(() => import("./ResourceMap"), {
  ssr: false,
  loading: () => <Placeholder>Loading map…</Placeholder>,
});

export function LazyResourceMap(props: ResourceMapProps) {
  const [visible, setVisible] = useState(false);

  if (visible) return <div className="h-full overflow-hidden rounded-xl"><ResourceMap {...props} /></div>;

  return (
    <Placeholder>
      <button type="button" onClick={() => setVisible(true)} className="rounded-full bg-neutral-900 px-5 py-2 font-medium text-white hover:bg-neutral-700">
        Show map
      </button>
    </Placeholder>
  );
}
