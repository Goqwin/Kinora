export type CrisisResource = {
  name: string;
  detail: string;
  contact: string;
  href?: string;
};

/**
 * Static crisis resources only. Never generate or alter with AI.
 * Team must verify every number before launch.
 */
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: "Emergency",
    detail: "If you or a child is in immediate danger",
    contact: "Call 911",
    href: "tel:911",
  },
  {
    name: "211 Alberta",
    detail: "Community and social services",
    contact: "Call or text 211",
    href: "https://www.ab.211.ca/",
  },
  {
    name: "988 Suicide Crisis Helpline",
    detail: "24 hour support for suicide crisis",
    contact: "Call or text 988",
    href: "tel:988",
  },
  {
    name: "Distress Centre Calgary",
    detail: "24 hour crisis line",
    contact: "403-266-4357",
    href: "tel:4032664357",
  },
  {
    name: "Alberta Family Violence Info Line",
    detail: "Support related to family violence",
    contact: "310-1818",
    href: "tel:3101818",
  },
  {
    name: "Kids Help Phone",
    detail: "Support for young people",
    contact: "1-800-668-6868",
    href: "tel:18006686868",
  },
];

export const CRISIS_INTRO =
  "If you need help right now, these services are available. You are not alone.";
