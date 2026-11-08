export const RESOURCE_CATEGORIES = [
  "childcare",
  "financial",
  "housing",
  "food",
  "health_family",
  "community",
  "activities",
  "legal_info",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export type CatalogResource = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  category: ResourceCategory | string;
  subcategory: string;
  addressLine: string;
  city: string;
  postalCode: string;
  longitude: number;
  latitude: number;
  costType: string;
  costNotes: string;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  eligibilitySummary: string;
  eligibilityRequirements: string[];
  languages: string[];
  phone: string;
  email: string;
  website: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  verifiedBy: string;
  isActive: boolean;
  distanceKm?: number;
};
