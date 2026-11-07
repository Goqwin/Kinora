"use client";

import mapboxgl, { type GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { CALGARY_CENTER, DEFAULT_ZOOM, MAPBOX_TOKEN, MAP_STYLE } from "@/lib/mapbox/config";
import { EMPTY_COLLECTION, radiusArea } from "@/lib/mapbox/radius";
import { toGeoJson } from "@/lib/mapbox/to-geojson";
import type { LngLat, Resource } from "@/types/resource";
import { RADIUS_SOURCE, RESOURCE_SOURCE, radiusFillLayer, radiusLineLayer, resourceLayer, userPointLayer } from "./layers";

export type ResourceMapProps = {
  resources: Resource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userPoint: LngLat | null;
  radiusKm: number;
};

export default function ResourceMap({ resources, selectedId, onSelect, userPoint, radiusKm }: ResourceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current!,
      accessToken: MAPBOX_TOKEN,
      style: MAP_STYLE,
      center: CALGARY_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource(RESOURCE_SOURCE, { type: "geojson", data: EMPTY_COLLECTION, promoteId: "id" });
      map.addSource(RADIUS_SOURCE, { type: "geojson", data: EMPTY_COLLECTION });
      [radiusFillLayer, radiusLineLayer, userPointLayer, resourceLayer].forEach((layer) => map.addLayer(layer));

      map.on("click", resourceLayer.id, (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onSelect(String(id));
      });
      map.on("mouseenter", resourceLayer.id, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", resourceLayer.id, () => (map.getCanvas().style.cursor = ""));
      setReady(true);
    });

    mapRef.current = map;
    return () => {
      setReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const data = toGeoJson(resources);
    map.getSource<GeoJSONSource>(RESOURCE_SOURCE)?.setData(data);
    if (!data.features.length) return;
    const bounds = new mapboxgl.LngLatBounds();
    data.features.forEach((f) => bounds.extend(f.geometry.coordinates as LngLat));
    if (userPoint) bounds.extend(userPoint);
    map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
  }, [ready, resources, userPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.getSource<GeoJSONSource>(RADIUS_SOURCE)?.setData(userPoint ? radiusArea(userPoint, radiusKm) : EMPTY_COLLECTION);
  }, [ready, userPoint, radiusKm]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const target = { source: RESOURCE_SOURCE, id: selectedId };
    map.setFeatureState(target, { selected: true });
    const location = resources.find((r) => r.id === selectedId)?.location;
    if (location) map.flyTo({ center: location, zoom: Math.max(map.getZoom(), 13) });
    return () => {
      mapRef.current?.setFeatureState(target, { selected: false });
    };
  }, [ready, selectedId, resources]);

  return <div ref={containerRef} className="h-full w-full" />;
}
