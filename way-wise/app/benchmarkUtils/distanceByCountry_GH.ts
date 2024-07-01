import { GraphHopperResponse } from "./types";

export function calculateDistanceByCountry(response: GraphHopperResponse): {
  distances: Record<string, number>;
  tollDistances: Record<string, number>;
  totalDistance: number;
  totalTollDistance: number;
} {
  if (!response.paths || !response.paths.length) {
    return {
      distances: {},
      tollDistances: {},
      totalDistance: 0,
      totalTollDistance: 0,
    };
  }

  const distances: Record<string, number> = {};
  const tollDistances: Record<string, number> = {};
  let totalDistance = 0;
  let totalTollDistance = 0;

  response.paths.forEach((path) => {
    const countryDetails = path.details?.country ?? [];
    const tollDetails = path.details?.toll ?? [];

    path.instructions?.forEach((instruction) => {
      const countryCode = countryDetails.find(([start, end]) => {
        return (
          instruction.interval[0] >= start && instruction.interval[1] <= end
        );
      })?.[2];

      if (countryCode && countryCode !== "missing") {
        distances[countryCode] =
          (distances[countryCode] || 0) + instruction.distance;
        totalDistance += instruction.distance;
      }

      const tollCategory = tollDetails.find(([start, end]) => {
        return (
          instruction.interval[0] >= start && instruction.interval[1] <= end
        );
      })?.[2];

      if (tollCategory && tollCategory !== "missing") {
        totalTollDistance += instruction.distance;
        if (countryCode && countryCode !== "missing") {
          tollDistances[countryCode] =
            (tollDistances[countryCode] || 0) + instruction.distance;
        }
      }
    });
  });

  Object.keys(distances).forEach((country) => {
    distances[country] /= 1000;
  });

  Object.keys(tollDistances).forEach((country) => {
    tollDistances[country] /= 1000;
  });

  totalDistance /= 1000;
  totalTollDistance /= 1000;

  return {
    distances,
    tollDistances,
    totalDistance,
    totalTollDistance,
  };
}
