"use client";

import { useEffect } from "react";
import type { Resource } from "@/types/resource";
import { ResourceCard } from "./ResourceCard";

type Props = { resources: Resource[]; selectedId: string | null; onSelect: (id: string) => void };

export function ResourceList({ resources, selectedId, onSelect }: Props) {
  useEffect(() => {
    if (selectedId) document.getElementById(`resource-${selectedId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  if (!resources.length) return <p className="text-neutral-600">No resources match these filters. Try a larger radius.</p>;

  return (
    <ul className="grid gap-3">
      {resources.map((r) => (
        <li key={r.id}>
          <ResourceCard resource={r} selected={r.id === selectedId} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
