import polyline from "@mapbox/polyline";
import type { LoaderFunction, LinksFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LatLngTuple } from "leaflet";
import { decode } from "polyline";

import { ClientOnly } from "../components/map/client-only";
import { Map } from "../components/map/map.client";
import { prisma } from "../db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const benchmarkId = params.benchmarkId || "1";
  const benchmarkIdInt = parseInt(benchmarkId, 10);
  try {
    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkIdInt },
      include: {
        run: true,
        rawRoute: {
          include: {
            reference: true,
          },
        },
        routingEngineResults: {
          select: {
            name: true,
            geometry: true,
          },
        },
      },
    });

    if (!benchmark) {
      return {
        status: 404,
        error: "Benchmark not found",
      };
    }
    const geometries: Record<string, string> = {};

    benchmark.routingEngineResults.forEach((re) => {
      if (!re.name) {
        geometries[re.name] = "";
      }
      if (re.name === "OSRM") {
        geometries[re.name] = JSON.parse(re.geometry || "").slice(2, -1);
      } else if (re.name === "Valhalla") {
        geometries[re.name] = re.geometry?.slice(1) || "";
      } else if (re.name === "GraphHopper") {
        geometries[re.name] = JSON.parse(re.geometry!).slice(1) || "";
      }
    });
    if (
      benchmark.rawRoute.reference &&
      benchmark.rawRoute.reference.geometries
    ) {
      geometries["Reference"] = benchmark.rawRoute.reference.geometries.slice(
        2,
        -1,
      );
    }

    return geometries;
  } catch (error) {
    console.error("Error fetching benchmark data:", error);
    return {
      status: 500,
      error: "Internal server error",
    };
  }
};

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://unpkg.com/leaflet@1.8.0/dist/leaflet.css",
  },
];
interface StyleProps {
  color: string;
  opacity: number;
}
export default function Index() {
  const mapHeight = "100vh";
  const geometries: Record<string, string> = useLoaderData();

  const colorMap: Record<string, StyleProps> = {
    OSRM: { color: "red", opacity: 0.9 },
    GraphHopper: { color: "green", opacity: 0.9 },
    Valhalla: { color: "blue", opacity: 0.9 },
    Reference: { color: "black", opacity: 0.7 },
  };
  type PolylineData = LatLngTuple[] | LatLngTuple[][];

  const decodedPolylines: Record<string, PolylineData> = {};

  Object.entries(geometries).forEach(([name, geometry]) => {
    // Unescape backslashes before decoding
    const unescapedGeometry = geometry.replace(/\\\\/g, "\\");

    if (name === "OSRM") {
      const encodedPolylines = unescapedGeometry
        .split('","')
        .map((s) => s.trim());
      const segmentCoordinates: LatLngTuple[][] = encodedPolylines.map(
        (polylineStr) => {
          return polyline
            .decode(polylineStr, 5)
            .map((coord): LatLngTuple => [coord[0], coord[1]]);
        },
      );
      decodedPolylines[name] = segmentCoordinates;
    } else if (name === "GraphHopper" || name === "Valhalla") {
      const decodedCoordinates: LatLngTuple[] = decode(
        unescapedGeometry,
        name === "Valhalla" ? 6 : 5,
      ).map((coord): LatLngTuple => [coord[0], coord[1]]);
      decodedPolylines[name] = [decodedCoordinates];
    } else if (name === "Reference") {
      const encodedPolylines = unescapedGeometry
        .split('","')
        .map((s) => s.trim());
      const segmentCoordinates: LatLngTuple[][] = encodedPolylines.map(
        (polylineStr) => {
          return polyline
            .decode(polylineStr, 5)
            .map((coord): LatLngTuple => [coord[0], coord[1]]);
        },
      );
      decodedPolylines[name] = segmentCoordinates;
    }
  });

  return (
    <ClientOnly
      fallback={
        <div
          id="skeleton"
          style={{ height: mapHeight, background: "#d1d1d1" }}
        />
      }
    >
      {() => (
        <Map
          height={mapHeight}
          polylines={decodedPolylines}
          colorMap={colorMap}
        />
      )}
    </ClientOnly>
  );
}
