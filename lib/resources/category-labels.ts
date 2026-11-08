/** Client-safe category display labels (no Node or database imports). */

export const CATEGORY_LABELS: Record<string, string> = {
  childcare: "Childcare",
  financial: "Financial aid",
  food: "Food support",
  housing: "Housing",
  activities: "Activities",
  health_family: "Health and family",
  community: "Community",
  legal_info: "Legal info",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
