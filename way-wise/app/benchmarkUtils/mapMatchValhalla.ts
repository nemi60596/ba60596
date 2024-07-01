import { decode } from "polyline";

import {
  MapMatchResult,
  RouteResponse,
  ValhallaMapMatchRequest,
} from "./types";

export function calculateTollDistanceByCountry(
  mapMatchResult: MapMatchResult,
): Record<string, number> {
  const tollDistances: Record<string, number> = {};

  mapMatchResult.edges.forEach((edge) => {
    if (edge.toll) {
      const adminIndex = edge.end_node.admin_index;
      const countryCode = mapMatchResult.admins[adminIndex].country_code;
      const edgeLength = edge.length;

      tollDistances[countryCode] =
        (tollDistances[countryCode] || 0) + edgeLength;
    }
  });

  return tollDistances;
}

type DistanceByCountry = Record<string, number>;

export async function mapMatchInValhalla(response: RouteResponse) {
  if (
    !response ||
    !response.trip ||
    !response.trip.legs ||
    !response.trip.legs[0].shape
  ) {
    console.error(
      "Invalid response format: missing required 'shape' data in the legs",
    );
    return;
  }
  const legShape = response.trip.legs.map((leg) => leg.shape).join(";");
  const coordinates = decode(legShape, 6).map((point: number[]) => {
    return { lat: point[0], lon: point[1] };
  });
  const mapMatchRequest: ValhallaMapMatchRequest = {
    shape: coordinates,
    costing: "auto",
    shape_match: "walk_or_snap",
    filters: {
      attributes: [
        "edge.names",
        "edge.id",
        "edge.weighted_grade",
        "edge.speed",
        "edge.toll",
        "edge.length",
        "admin.state_code",
        "admin.state_text",
        "admin.country_code",
        "admin.country_text",
        "node.admin_index",
      ],
      action: "include",
    },
  };

  const url = "http://localhost:8002/trace_attributes";
  const options = {
    method: "POST",
    body: JSON.stringify(mapMatchRequest),
    headers: { "Content-Type": "application/json" },
  };

  try {
    const fetchResponse = await fetch(url, options);
    const data = await fetchResponse.json();
    return data;
  } catch (error) {
    console.error("Error while map-matching:", error);
    return {
      distances: {},
      tollDistances: {},
      totalDistance: 0,
      totalTollDistance: 0,
    };
  }
}

export function calculateDistanceByCountry(
  mapMatchResult: MapMatchResult,
): DistanceByCountry {
  const distances: DistanceByCountry = {};

  mapMatchResult.edges.forEach((edge) => {
    const adminIndex = edge.end_node.admin_index;
    const countryCode = mapMatchResult.admins[adminIndex].country_code;
    const edgeLength = edge.length;

    distances[countryCode] = (distances[countryCode] || 0) + edgeLength;
  });

  return distances;
}

export async function handleMapMatchingAndCalculations(
  routeResponse: RouteResponse,
) {
  try {
    const mapMatchResult = await mapMatchInValhalla(routeResponse);

    if (!mapMatchResult || !mapMatchResult.edges) {
      console.error("Map matching failed or returned no edges");
      return;
    }

    const distances = calculateDistanceByCountry(mapMatchResult);
    const tollDistances = calculateTollDistanceByCountry(mapMatchResult);

    const totalDistance = Object.values(distances).reduce(
      (acc, cur) => acc + cur,
      0,
    );
    const totalTollDistance = Object.values(tollDistances).reduce(
      (acc, cur) => acc + cur,
      0,
    );

    return {
      distances,
      tollDistances,
      totalDistance,
      totalTollDistance,
    };
  } catch (error) {
    console.error("Error in processing:", error);
    return {
      distances: {},
      tollDistances: {},
      totalDistance: 0,
      totalTollDistance: 0,
    };
  }
}
