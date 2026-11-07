export const CATEGORIES = {
  childcare: { label: "Childcare", color: "#0d6e69" },
  financial: { label: "Financial help", color: "#b5651d" },
  community: { label: "Community", color: "#6a4c93" },
  activities: { label: "Kids' activities", color: "#2a7ab0" },
  legal: { label: "Legal help", color: "#a33a3a" },
  family_support: { label: "Family support", color: "#4f7d2f" },
} as const;

export type ResourceCategory = keyof typeof CATEGORIES;
export type LngLat = [lng: number, lat: number];

export interface Resource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  address: string | null;
  location: LngLat | null;
  distanceKm: number | null;
  cost: string;
  eligibility: string;
  minAge: number | null;
  maxAge: number | null;
  phone: string | null;
  website: string | null;
  lastVerifiedAt: string;
}
