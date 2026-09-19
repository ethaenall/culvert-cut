import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Site, Collection } from "./domain";
export default function BasinMap({
  sites,
  streams,
  coho,
  impaired,
  showCoho,
  showImpaired,
  selected,
  onSelect,
  focus,
}: {
  sites: Site[];
  streams: Collection;
  coho: Collection;
  impaired: Collection;
  showCoho: boolean;
  showImpaired: boolean;
  selected: Site | null;
  onSelect: (s: Site) => void;
  focus: number[] | null;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null),
    callback = useRef(onSelect),
    siteRef = useRef(sites);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  callback.current = onSelect;
  siteRef.current = sites;
  useEffect(() => {
    if (!container.current) return;
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: container.current,
        center: [-122.065, 47.625],
        zoom: 10.8,
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: {
            basemap: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#15252c" },
            },
            {
              id: "basemap",
              type: "raster",
              source: "basemap",
              paint: {
                "raster-opacity": 0.6,
                "raster-saturation": -1,
                "raster-brightness-max": 0.35,
              },
            },
          ],
        },
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = m;
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    m.on("error", () => setFailed(true));
    m.on("load", () => {
      for (const [name, data] of Object.entries({
        streams,
        coho,
        impaired,
        sites: { type: "FeatureCollection", features: siteRef.current },
        selected: { type: "FeatureCollection", features: [] },
      }))
        m.addSource(name, { type: "geojson", data: data as Collection });
      m.addLayer({
        id: "waterways",
        type: "line",
        source: "streams",
        paint: {
          "line-color": "#47818c",
          "line-width": 1.35,
          "line-opacity": 0.65,
        },
      });
      m.addLayer({
        id: "impaired-fill",
        type: "fill",
        source: "impaired",
        paint: { "fill-color": "#cf95db", "fill-opacity": 0.15 },
      });
      m.addLayer({
        id: "impaired",
        type: "line",
        source: "impaired",
        paint: {
          "line-color": "#cf95db",
          "line-width": 3,
          "line-opacity": 0.85,
        },
      });
      m.addLayer({
        id: "coho",
        type: "line",
        source: "coho",
        paint: {
          "line-color": [
            "match",
            ["get", "CurrentAnadromousAccess"],
            "Accessible",
            "#82cdbc",
            "Partially accessible",
            "#f0ca78",
            "Inaccessible",
            "#ea9175",
            "#597479",
          ],
          "line-width": 3,
          "line-opacity": 0.85,
        },
      });
      for (const status of ["total", "partial", "passable", "unknown"]) {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 28;
        const c = canvas.getContext("2d")!;
        c.fillStyle = (
          {
            total: "#ee9475",
            partial: "#edcb7e",
            passable: "#85cfc5",
            unknown: "#a4aeb9",
          } as Record<string, string>
        )[status];
        c.strokeStyle = "#14242c";
        c.lineWidth = 3;
        c.beginPath();
        if (status === "total") c.rect(5, 5, 18, 18);
        else if (status === "passable") {
          c.moveTo(14, 2);
          c.lineTo(26, 14);
          c.lineTo(14, 26);
          c.lineTo(2, 14);
          c.closePath();
        } else if (status === "unknown") {
          c.moveTo(14, 3);
          c.lineTo(26, 25);
          c.lineTo(2, 25);
          c.closePath();
        } else c.arc(14, 14, 10, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        m.addImage(status, c.getImageData(0, 0, 28, 28));
      }
      m.addLayer({
        id: "selected-halo",
        type: "circle",
        source: "selected",
        paint: {
          "circle-radius": 17,
          "circle-color": "#ffffff",
          "circle-opacity": 0.13,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });
      m.addLayer({
        id: "sites",
        type: "symbol",
        source: "sites",
        layout: {
          "icon-image": ["get", "status"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 9, 0.48, 13, 0.85],
          "icon-allow-overlap": true,
        },
      });
      m.on("idle", () => {
        if (container.current)
          container.current.dataset.rendered = String(
            m.queryRenderedFeatures({ layers: ["sites"] }).length,
          );
      });
      m.on("click", "sites", (e) => {
        const id = e.features?.[0]?.properties?.id;
        const s = siteRef.current.find((x) => x.properties.id === id);
        if (s) callback.current(s);
      });
      m.on(
        "mouseenter",
        "sites",
        () => (m.getCanvas().style.cursor = "pointer"),
      );
      m.on("mouseleave", "sites", () => (m.getCanvas().style.cursor = ""));
      setReady(true);
      if (container.current) container.current.dataset.ready = "true";
    });
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (ready)
      (map.current?.getSource("sites") as GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: sites,
      });
  }, [sites, ready]);
  useEffect(() => {
    if (!ready) return;
    for (const id of ["impaired", "impaired-fill"])
      map.current?.setLayoutProperty(
        id,
        "visibility",
        showImpaired ? "visible" : "none",
      );
    map.current?.setLayoutProperty(
      "coho",
      "visibility",
      showCoho ? "visible" : "none",
    );
  }, [ready, showCoho, showImpaired]);
  useEffect(() => {
    if (ready)
      (map.current?.getSource("selected") as GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: selected ? [selected] : [],
      });
  }, [ready, selected]);
  useEffect(() => {
    if (focus && ready)
      map.current?.flyTo({
        center: [focus[0], focus[1]],
        zoom: 13,
        duration: 1000,
      });
  }, [focus, ready]);
  return (
    <>
      <div
        className="map"
        ref={container}
        aria-label="Interactive map of fish-passage sites"
      />
      {failed && (
        <div className="map-notice">
          Some map tiles are unavailable. Bundled records and the crossing list
          remain available.
        </div>
      )}
    </>
  );
}
