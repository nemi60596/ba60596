/**
 * This component, DuplicateMap, is a playground for displaying two routes on a Leaflet map using coordinates
 * from URL search parameters. It dynamically imports the Leaflet library for client-side rendering only.
 * It initializes the map and sets it to the start location of Route A, then adds markers for the start and
 * destination points of both Route A and Route B. It also adjusts the map's bounds to include all markers.
 * The component ensures that all necessary resources are loaded and cleaned up properly.
 */

import { useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function DuplicateMap() {
  const [searchParams] = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [map, setMap] = useState(null);

  const routeAStartLat = parseFloat(searchParams.get("routeAStartLat") || "0");
  const routeAStartLon = parseFloat(searchParams.get("routeAStartLon") || "0");
  const routeADestLat = parseFloat(searchParams.get("routeADestLat") || "0");
  const routeADestLon = parseFloat(searchParams.get("routeADestLon") || "0");

  const routeBStartLat = parseFloat(searchParams.get("routeBStartLat") || "0");
  const routeBStartLon = parseFloat(searchParams.get("routeBStartLon") || "0");
  const routeBDestLat = parseFloat(searchParams.get("routeBDestLat") || "0");
  const routeBDestLon = parseFloat(searchParams.get("routeBDestLon") || "0");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const loadMap = async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        if (
          isNaN(routeAStartLat) ||
          isNaN(routeAStartLon) ||
          isNaN(routeADestLat) ||
          isNaN(routeADestLon) ||
          isNaN(routeBStartLat) ||
          isNaN(routeBStartLon) ||
          isNaN(routeBDestLat) ||
          isNaN(routeBDestLon)
        ) {
          console.error("Invalid coordinates provided");
          return;
        }

        // Create a new map if it doesn't exist
        if (!map) {
          const newMap = L.map("map").setView(
            [routeAStartLat, routeAStartLon],
            13,
          );
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
          }).addTo(newMap);
          setMap(newMap);
        }

        const circleOptionsA = { color: "blue", radius: 5 };
        L.circleMarker([routeAStartLat, routeAStartLon], circleOptionsA)
          .addTo(map)
          .bindPopup("Route A Start");
        L.circleMarker([routeADestLat, routeADestLon], circleOptionsA)
          .addTo(map)
          .bindPopup("Route A Destination");

        const circleOptionsB = { color: "red", radius: 5 };
        L.circleMarker([routeBStartLat, routeBStartLon], circleOptionsB)
          .addTo(map)
          .bindPopup("Route B Start");
        L.circleMarker([routeBDestLat, routeBDestLon], circleOptionsB)
          .addTo(map)
          .bindPopup("Route B Destination");

        map.fitBounds(
          L.latLngBounds([
            [routeAStartLat, routeAStartLon],
            [routeADestLat, routeADestLon],
            [routeBStartLat, routeBStartLon],
            [routeBDestLat, routeBDestLon],
          ]),
        );
      } catch (error) {
        console.error("Error loading Leaflet or creating map:", error);
      }
    };

    loadMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [
    isClient,
    map,
    routeAStartLat,
    routeAStartLon,
    routeADestLat,
    routeADestLon,
    routeBStartLat,
    routeBStartLon,
    routeBDestLat,
    routeBDestLon,
  ]);

  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <div id="map" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}
