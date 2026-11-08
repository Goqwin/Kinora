import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "mapbox-gl";

import { MAP_CATEGORY_COLORS } from "@/lib/mapbox/map-categories";

export const RESOURCE_SOURCE = "resources";
export const RADIUS_SOURCE = "radius";
export const BUILDINGS_LAYER_ID = "3d-buildings";
const RADIUS_COLOR = "#0d9488";

const categoryColor = [
  "match",
  ["get", "category"],
  ...Object.entries(MAP_CATEGORY_COLORS).flatMap(([key, color]) => [key, color]),
  "#64748b",
] as ExpressionSpecification;

const isSelected: ExpressionSpecification = [
  "boolean",
  ["feature-state", "selected"],
  false,
];

const isHovered: ExpressionSpecification = [
  "boolean",
  ["feature-state", "hover"],
  false,
];

const isActive: ExpressionSpecification = [
  "any",
  isSelected,
  isHovered,
];

export const resourceLayer: CircleLayerSpecification = {
  id: "resource-points",
  type: "circle",
  source: RESOURCE_SOURCE,
  paint: {
    "circle-color": categoryColor,
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      ["case", isActive, 11, 7],
      14,
      ["case", isActive, 17, 12],
      16,
      ["case", isActive, 22, 15],
    ],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": ["case", isActive, 4, 2.5],
    "circle-opacity": 0.98,
  },
};

export const resourceHaloLayer: CircleLayerSpecification = {
  id: "resource-halos",
  type: "circle",
  source: RESOURCE_SOURCE,
  paint: {
    "circle-color": categoryColor,
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      ["case", isActive, 22, 12],
      14,
      ["case", isActive, 34, 20],
    ],
    "circle-opacity": ["case", isActive, 0.38, 0.16],
    "circle-blur": 0.55,
  },
};

export const resourceLabelLayer: SymbolLayerSpecification = {
  id: "resource-labels",
  type: "symbol",
  source: RESOURCE_SOURCE,
  minzoom: 13,
  layout: {
    "text-field": ["get", "name"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 13, 11, 16, 14],
    "text-offset": [0, 1.35],
    "text-anchor": "top",
    "text-max-width": 10,
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
    "text-allow-overlap": false,
  },
  paint: {
    "text-color": "#13201c",
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.6,
  },
};

export const radiusFillLayer: FillLayerSpecification = {
  id: "radius-fill",
  type: "fill",
  source: RADIUS_SOURCE,
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: { "fill-color": RADIUS_COLOR, "fill-opacity": 0.12 },
};

export const radiusLineLayer: LineLayerSpecification = {
  id: "radius-line",
  type: "line",
  source: RADIUS_SOURCE,
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: {
    "line-color": RADIUS_COLOR,
    "line-width": 2.5,
    "line-dasharray": [1.4, 1.1],
  },
};

export const userPointLayer: CircleLayerSpecification = {
  id: "user-point",
  type: "circle",
  source: RADIUS_SOURCE,
  filter: ["==", ["geometry-type"], "Point"],
  paint: {
    "circle-color": "#ffffff",
    "circle-radius": 8,
    "circle-stroke-color": RADIUS_COLOR,
    "circle-stroke-width": 4,
  },
};

/** Visible 3D buildings from zoom 14 (Calgary downtown / neighbourhoods). */
export function buildingsExtrusionLayer(
  theme: "light" | "dark",
): FillExtrusionLayerSpecification {
  return {
    id: BUILDINGS_LAYER_ID,
    source: "composite",
    "source-layer": "building",
    filter: [
      "all",
      ["==", ["get", "extrude"], "true"],
      ["!=", ["get", "underground"], "true"],
    ],
    type: "fill-extrusion",
    minzoom: 14,
    paint: {
      "fill-extrusion-color": theme === "dark" ? "#3d5c56" : "#c5d4cf",
      "fill-extrusion-height": ["coalesce", ["get", "height"], 8],
      "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
      "fill-extrusion-opacity": theme === "dark" ? 0.85 : 0.7,
      "fill-extrusion-vertical-gradient": true,
    },
  };
}
