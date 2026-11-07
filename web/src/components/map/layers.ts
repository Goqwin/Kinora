import type { CircleLayerSpecification, ExpressionSpecification, FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";
import { CATEGORIES } from "@/types/resource";

export const RESOURCE_SOURCE = "resources";
export const RADIUS_SOURCE = "radius";
const RADIUS_COLOR = "#0d6e69";

const categoryColor = [
  "match",
  ["get", "category"],
  ...Object.entries(CATEGORIES).flatMap(([key, { color }]) => [key, color]),
  "#666666",
] as ExpressionSpecification;

const isSelected: ExpressionSpecification = ["boolean", ["feature-state", "selected"], false];

export const resourceLayer: CircleLayerSpecification = {
  id: "resource-points",
  type: "circle",
  source: RESOURCE_SOURCE,
  paint: {
    "circle-color": categoryColor,
    "circle-radius": ["case", isSelected, 11, 7],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": ["case", isSelected, 3, 2],
  },
};

export const radiusFillLayer: FillLayerSpecification = {
  id: "radius-fill",
  type: "fill",
  source: RADIUS_SOURCE,
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: { "fill-color": RADIUS_COLOR, "fill-opacity": 0.08 },
};

export const radiusLineLayer: LineLayerSpecification = {
  id: "radius-line",
  type: "line",
  source: RADIUS_SOURCE,
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: { "line-color": RADIUS_COLOR, "line-width": 1.5, "line-dasharray": [2, 2] },
};

export const userPointLayer: CircleLayerSpecification = {
  id: "user-point",
  type: "circle",
  source: RADIUS_SOURCE,
  filter: ["==", ["geometry-type"], "Point"],
  paint: { "circle-color": "#ffffff", "circle-radius": 6, "circle-stroke-color": RADIUS_COLOR, "circle-stroke-width": 3 },
};
