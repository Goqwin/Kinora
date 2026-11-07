import type { LngLat, Resource } from "@/types/resource";

const SAMPLE: Omit<Resource, "distanceKm">[] = [
  { id: "ab-child-care-subsidy", name: "Alberta Child Care Subsidy", description: "Lowers the monthly cost of licensed daycare, preschool and out-of-school care.", category: "childcare", address: null, location: null, cost: "Free to apply", eligibility: "Income-tested", minAge: 0, maxAge: 12, phone: null, website: null, lastVerifiedAt: "2026-10-01" },
  { id: "canada-child-benefit", name: "Canada Child Benefit", description: "Tax-free monthly payment for families with children under 18.", category: "financial", address: null, location: null, cost: "Free", eligibility: "File taxes every year", minAge: 0, maxAge: 17, phone: null, website: null, lastVerifiedAt: "2026-10-01" },
  { id: "211-alberta", name: "211 Alberta", description: "Free, confidential 24/7 line connecting you to local services.", category: "family_support", address: null, location: null, cost: "Free", eligibility: "Anyone", minAge: null, maxAge: null, phone: "2-1-1", website: null, lastVerifiedAt: "2026-10-01" },
  { id: "sample-bridgeland-daycare", name: "Bridgeland Little Steps Daycare (Sample)", description: "Licensed daycare for infants to preschoolers. Accepts the provincial subsidy.", category: "childcare", address: "Bridgeland, Calgary", location: [-114.038, 51.055], cost: "$$", eligibility: "Open enrolment", minAge: 0, maxAge: 5, phone: null, website: null, lastVerifiedAt: "2026-09-15" },
  { id: "sample-forest-lawn-dayhome", name: "Forest Lawn Family Day Home (Sample)", description: "Small day home with evening and weekend spots for shift workers.", category: "childcare", address: "Forest Lawn, Calgary", location: [-113.958, 51.041], cost: "$", eligibility: "Open enrolment", minAge: 0, maxAge: 5, phone: null, website: null, lastVerifiedAt: "2026-08-20" },
  { id: "sample-single-parents-circle", name: "Single Parents Circle (Sample)", description: "Peer support evenings with free childcare in the next room.", category: "community", address: "Beltline, Calgary", location: [-114.068, 51.042], cost: "Free", eligibility: "Single parents", minAge: null, maxAge: null, phone: null, website: null, lastVerifiedAt: "2026-09-30" },
  { id: "sample-makers-club", name: "Forest Lawn After-School Makers (Sample)", description: "Robotics, art and cooking for elementary kids.", category: "activities", address: "Forest Lawn, Calgary", location: [-113.962, 51.039], cost: "Free with Fair Entry", eligibility: "Calgary residents", minAge: 6, maxAge: 12, phone: null, website: null, lastVerifiedAt: "2026-09-05" },
  { id: "sample-mediation", name: "Family Mediation Drop-in (Sample)", description: "Free first session to help separated parents agree on schedules.", category: "legal", address: "Downtown, Calgary", location: [-114.065, 51.046], cost: "First session free", eligibility: "Separated parents", minAge: null, maxAge: null, phone: null, website: null, lastVerifiedAt: "2026-07-12" },
];

const haversineKm = ([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) => {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

export function searchSampleResources(userPoint: LngLat | null, radiusKm: number): Resource[] {
  return SAMPLE.map((r) => ({ ...r, distanceKm: userPoint && r.location ? haversineKm(userPoint, r.location) : null }))
    .filter((r) => r.distanceKm === null || r.distanceKm <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.name.localeCompare(b.name));
}
