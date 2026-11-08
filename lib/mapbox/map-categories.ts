import { CATEGORY_LABELS } from "@/lib/resources/category-labels";

/** Teal-adjacent category colors — readable on light and dark map styles. */
export const MAP_CATEGORY_COLORS: Record<string, string> = {
  childcare: "#0d9488",
  financial: "#c27803",
  food: "#ea580c",
  housing: "#dc2626",
  health_family: "#16a34a",
  community: "#7c3aed",
  activities: "#0284c7",
  legal_info: "#475569",
};

export function categoryMapColor(category: string): string {
  return MAP_CATEGORY_COLORS[category] ?? "#64748b";
}

export function categoryMapLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
