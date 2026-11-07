"use client";

import mapboxgl, { type GeoJSONSource, type MapMouseEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Expand, LocateFixed, Minimize2, Mountain } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme/theme-provider";
import {
  BUILDINGS_MIN_ZOOM,
  CALGARY_CENTER,
  DEFAULT_BEARING,
  DEFAULT_PITCH,
  DEFAULT_ZOOM,
  IMMERSIVE_PITCH,
  MAPBOX_TOKEN,
  isLikelyValidMapboxPublicToken,
  mapStyleForTheme,
} from "@/lib/mapbox/config";
import { categoryMapLabel } from "@/lib/mapbox/map-categories";
import { EMPTY_COLLECTION, radiusArea, type LngLat } from "@/lib/mapbox/radius";
import { resourcesToGeoJson } from "@/lib/mapbox/to-geojson";
import type { CatalogResource } from "@/lib/resources/types";
import type { ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

import {
  BUILDINGS_LAYER_ID,
  RADIUS_SOURCE,
  RESOURCE_SOURCE,
  buildingsExtrusionLayer,
  radiusFillLayer,
  radiusLineLayer,
  resourceHaloLayer,
  resourceLabelLayer,
  resourceLayer,
  userPointLayer,
} from "./layers";

export type ResourceMapProps = {
  resources: CatalogResource[];
  selectedId: string | null;
  onSelect: (slug: string) => void;
  userPoint: LngLat | null;
  radiusKm: number;
  className?: string;
};

function hideFlatBuildingFills(map: mapboxgl.Map) {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    const sourceLayer =
      "source-layer" in layer ? String(layer["source-layer"] ?? "") : "";
    const isBuildingFill =
      layer.type === "fill" &&
      (layer.id.includes("building") || sourceLayer === "building");
    if (isBuildingFill) {
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch {
        // ignore missing layout
      }
    }
  }
}

function applyImmersion(map: mapboxgl.Map, theme: ThemeMode) {
  try {
    map.setFog({
      color: theme === "dark" ? "#0b1412" : "#dfe9e6",
      "high-color": theme === "dark" ? "#1a332e" : "#9ec8bf",
      "horizon-blend": 0.12,
      range: [0.6, 12],
      "space-color": theme === "dark" ? "#050a09" : "#c8ddd8",
      "star-intensity": theme === "dark" ? 0.35 : 0,
    });
  } catch {
    // Older styles may ignore fog.
  }
}

function addMapDataLayers(map: mapboxgl.Map, theme: ThemeMode) {
  if (!map.getSource(RESOURCE_SOURCE)) {
    map.addSource(RESOURCE_SOURCE, {
      type: "geojson",
      data: EMPTY_COLLECTION,
      promoteId: "id",
    });
  }
  if (!map.getSource(RADIUS_SOURCE)) {
    map.addSource(RADIUS_SOURCE, {
      type: "geojson",
      data: EMPTY_COLLECTION,
    });
  }

  hideFlatBuildingFills(map);
  applyImmersion(map, theme);

  const beforeId = map
    .getStyle()
    .layers?.find(
      (layer) => layer.type === "symbol" && Boolean(layer.layout?.["text-field"]),
    )?.id;

  if (map.getSource("composite")) {
    if (map.getLayer(BUILDINGS_LAYER_ID)) {
      map.removeLayer(BUILDINGS_LAYER_ID);
    }
    try {
      map.addLayer(buildingsExtrusionLayer(theme), beforeId);
    } catch {
      // Some styles omit composite buildings; map still works flat.
    }
  }

  const overlayLayers = [
    radiusFillLayer,
    radiusLineLayer,
    userPointLayer,
    resourceHaloLayer,
    resourceLayer,
    resourceLabelLayer,
  ];
  for (const layer of overlayLayers) {
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer);
    }
  }

  if (map.getLayer(resourceLabelLayer.id)) {
    map.setPaintProperty(
      resourceLabelLayer.id,
      "text-color",
      theme === "dark" ? "#e8f2ef" : "#13201c",
    );
    map.setPaintProperty(
      resourceLabelLayer.id,
      "text-halo-color",
      theme === "dark" ? "#0e1614" : "#ffffff",
    );
  }
}

function syncSources(
  map: mapboxgl.Map,
  resources: CatalogResource[],
  userPoint: LngLat | null,
  radiusKm: number,
) {
  map
    .getSource<GeoJSONSource>(RESOURCE_SOURCE)
    ?.setData(resourcesToGeoJson(resources));
  map
    .getSource<GeoJSONSource>(RADIUS_SOURCE)
    ?.setData(userPoint ? radiusArea(userPoint, radiusKm) : EMPTY_COLLECTION);
}

function buildPopupHtml(resource: CatalogResource): string {
  const category = categoryMapLabel(resource.category);
  const distance =
    typeof resource.distanceKm === "number"
      ? `${resource.distanceKm.toFixed(1)} km`
      : "";
  return `
    <div class="kinora-map-popup">
      <p class="kinora-map-popup__eyebrow">${category}</p>
      <p class="kinora-map-popup__title">${escapeHtml(resource.name)}</p>
      ${distance ? `<p class="kinora-map-popup__meta">${distance}</p>` : ""}
      <p class="kinora-map-popup__hint">Open in list for details</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function ResourceMap({
  resources,
  selectedId,
  onSelect,
  userPoint,
  radiusKm,
  className,
}: ResourceMapProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  const themeAppliedRef = useRef<ThemeMode | null>(null);
  const resourcesRef = useRef(resources);
  const userPointRef = useRef(userPoint);
  const radiusKmRef = useRef(radiusKm);
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [view3d, setView3d] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    resourcesRef.current = resources;
    userPointRef.current = userPoint;
    radiusKmRef.current = radiusKm;
  }, [onSelect, resources, userPoint, radiusKm]);

  const resizeMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    // Double rAF so layout settles after fullscreen / sticky height changes.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => map.resize());
    });
  }, []);

  useEffect(() => {
    if (!isLikelyValidMapboxPublicToken(MAPBOX_TOKEN) || !containerRef.current) {
      return;
    }

    setMapError(null);
    const initialTheme = theme;
    themeAppliedRef.current = initialTheme;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      accessToken: MAPBOX_TOKEN,
      style: mapStyleForTheme(initialTheme),
      center: CALGARY_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      antialias: true,
      attributionControl: true,
      cooperativeGestures: true,
    });

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true, showCompass: true }),
      "top-right",
    );
    map.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-left",
    );

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 18,
      maxWidth: "260px",
      className: "kinora-map-popup-root",
    });
    popupRef.current = popup;

    map.on("error", (event) => {
      const message =
        event.error?.message ?? "Mapbox could not load. Check your token.";
      if (/token/i.test(message)) {
        setMapError(
          "Mapbox rejected the access token. Paste a full public token (pk.*) into NEXT_PUBLIC_MAPBOX_TOKEN.",
        );
      } else {
        setMapError("The map could not load. You can still use the list view.");
      }
    });

    const clearHover = () => {
      if (hoveredIdRef.current) {
        map.setFeatureState(
          { source: RESOURCE_SOURCE, id: hoveredIdRef.current },
          { hover: false },
        );
        hoveredIdRef.current = null;
      }
      map.getCanvas().style.cursor = "";
    };

    map.on("load", () => {
      addMapDataLayers(map, initialTheme);
      syncSources(
        map,
        resourcesRef.current,
        userPointRef.current,
        radiusKmRef.current,
      );

      map.on("click", resourceLayer.id, (e: MapMouseEvent) => {
        const feature = e.features?.[0];
        const props = feature?.properties as
          | { id?: string; name?: string; category?: string }
          | undefined;
        const id = props?.id;
        if (typeof id !== "string") return;
        onSelectRef.current(id);

        const match = resourcesRef.current.find((r) => r.slug === id);
        if (match && feature?.geometry.type === "Point") {
          const coords = feature.geometry.coordinates as [number, number];
          popup.setLngLat(coords).setHTML(buildPopupHtml(match)).addTo(map);
        }
      });

      map.on("mousemove", resourceLayer.id, (e: MapMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        map.getCanvas().style.cursor = "pointer";
        if (hoveredIdRef.current === id) return;
        if (hoveredIdRef.current) {
          map.setFeatureState(
            { source: RESOURCE_SOURCE, id: hoveredIdRef.current },
            { hover: false },
          );
        }
        hoveredIdRef.current = id;
        map.setFeatureState({ source: RESOURCE_SOURCE, id }, { hover: true });
      });

      map.on("mouseleave", resourceLayer.id, clearHover);

      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, {
          layers: [resourceLayer.id],
        });
        if (!hits.length) popup.remove();
      });

      setReady(true);
      resizeMap();
    });

    mapRef.current = map;
    return () => {
      setReady(false);
      popup.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      themeAppliedRef.current = null;
    };
    // Mount once; theme swaps handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeMap]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new ResizeObserver(() => resizeMap());
    observer.observe(shell);
    window.addEventListener("orientationchange", resizeMap);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resizeMap);
    };
  }, [resizeMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || themeAppliedRef.current === theme) return;

    themeAppliedRef.current = theme;
    setReady(false);
    map.setStyle(mapStyleForTheme(theme));
    map.once("style.load", () => {
      addMapDataLayers(map, theme);
      syncSources(
        map,
        resourcesRef.current,
        userPointRef.current,
        radiusKmRef.current,
      );
      setReady(true);
      resizeMap();
    });
  }, [theme, resizeMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    syncSources(map, resources, userPoint, radiusKm);
  }, [ready, resources, userPoint, radiusKm]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const data = resourcesToGeoJson(resources);
    if (!data.features.length) return;
    const bounds = new mapboxgl.LngLatBounds();
    for (const f of data.features) {
      bounds.extend(f.geometry.coordinates as LngLat);
    }
    if (userPoint) bounds.extend(userPoint);
    map.fitBounds(bounds, {
      padding: fullscreen ? 96 : 64,
      maxZoom: view3d ? 15.2 : 14.2,
      pitch: view3d ? DEFAULT_PITCH : 0,
      bearing: view3d ? DEFAULT_BEARING : 0,
      duration: 900,
    });
  }, [ready, resources, userPoint, view3d, fullscreen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const target = { source: RESOURCE_SOURCE, id: selectedId };
    map.setFeatureState(target, { selected: true });
    const match = resources.find((r) => r.slug === selectedId);
    if (match) {
      map.flyTo({
        center: [match.longitude, match.latitude],
        zoom: Math.max(
          map.getZoom(),
          view3d ? BUILDINGS_MIN_ZOOM + 0.35 : 13.6,
        ),
        pitch: view3d ? IMMERSIVE_PITCH : 0,
        bearing: view3d ? DEFAULT_BEARING : 0,
        essential: true,
        duration: 1100,
      });
      popupRef.current
        ?.setLngLat([match.longitude, match.latitude])
        .setHTML(buildPopupHtml(match))
        .addTo(map);
    }
    return () => {
      mapRef.current?.setFeatureState(target, { selected: false });
    };
  }, [ready, selectedId, resources, view3d]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const nextZoom = view3d
      ? Math.max(map.getZoom(), BUILDINGS_MIN_ZOOM)
      : map.getZoom();
    map.easeTo({
      zoom: nextZoom,
      pitch: view3d ? DEFAULT_PITCH : 0,
      bearing: view3d ? DEFAULT_BEARING : 0,
      duration: 750,
    });
  }, [ready, view3d]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    resizeMap();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      resizeMap();
    };
  }, [fullscreen, resizeMap]);

  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    const data = resourcesToGeoJson(resources);
    if (!data.features.length) {
      map.flyTo({
        center: CALGARY_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: view3d ? DEFAULT_PITCH : 0,
        bearing: view3d ? DEFAULT_BEARING : 0,
      });
      return;
    }
    const bounds = new mapboxgl.LngLatBounds();
    for (const f of data.features) {
      bounds.extend(f.geometry.coordinates as LngLat);
    }
    if (userPoint) bounds.extend(userPoint);
    map.fitBounds(bounds, {
      padding: fullscreen ? 96 : 64,
      maxZoom: 15,
      pitch: view3d ? DEFAULT_PITCH : 0,
      bearing: view3d ? DEFAULT_BEARING : 0,
      duration: 800,
    });
  }

  if (mapError) {
    return (
      <div
        className="grid h-full min-h-[320px] place-items-center px-4 py-8 text-center text-sm text-[var(--ink-muted)]"
        role="status"
      >
        <p>{mapError}</p>
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative isolate overflow-hidden bg-[var(--canvas-deep)]",
        fullscreen
          ? "fixed inset-0 z-[80] h-[100dvh] w-screen rounded-none"
          : cn("h-full w-full min-h-[320px]", className),
      )}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-[var(--shadow-md)] backdrop-blur-md transition hover:bg-[var(--surface)]",
              view3d && "border-[var(--accent)] text-[var(--accent)]",
            )}
            onClick={() => setView3d((v) => !v)}
            aria-pressed={view3d}
          >
            <Mountain className="h-3.5 w-3.5" aria-hidden />
            {view3d ? "Immersive 3D" : "Flat map"}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-[var(--shadow-md)] backdrop-blur-md transition hover:bg-[var(--surface)]"
            onClick={recenter}
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden />
            Recenter
          </button>
        </div>

        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-[var(--shadow-md)] backdrop-blur-md transition hover:bg-[var(--surface)]"
          onClick={() => setFullscreen((v) => !v)}
          aria-pressed={fullscreen}
        >
          {fullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" aria-hidden />
              Exit
            </>
          ) : (
            <>
              <Expand className="h-3.5 w-3.5" aria-hidden />
              Full screen
            </>
          )}
        </button>
      </div>

      {fullscreen ? (
        <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[var(--ink)]/70 px-3 py-1.5 text-[11px] text-white backdrop-blur-sm">
          Drag to look around · two-finger tilt · Esc to exit
        </p>
      ) : null}
    </div>
  );
}
