import { ActionFunctionArgs, redirect } from "@remix-run/node";

import { calculateDistanceByCountry } from "../benchmarkUtils/distanceByCountry_GH";
import fetchAllBenchmarks from "../benchmarkUtils/fetchAllBenchmarks";
import { handleMapMatchingAndCalculations } from "../benchmarkUtils/mapMatchValhalla";
import { prisma } from "../db.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DistanceCalculationFunction = (response: any) => any;

const distanceByCountryCalculators: Record<
  string,
  DistanceCalculationFunction
> = {
  Valhalla: handleMapMatchingAndCalculations,
  GraphHopper: calculateDistanceByCountry,
  default: () => {
    return {};
  },
};

function getDistanceCalculator(
  serviceName: string,
): DistanceCalculationFunction {
  return (
    distanceByCountryCalculators[serviceName] ||
    distanceByCountryCalculators["default"]
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const selection = formData.get("selectedRows")?.toString();
  const runId = Number(formData.get("runId"));

  if (!selection || !runId) {
    console.error("Required fields missing");
    return new Response("Required fields missing", { status: 400 });
  }

  const existingRun = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      benchmarks: {
        select: {
          id: true,
        },
      },
    },
  });

  if (existingRun && existingRun.benchmarks.length > 0) {
    console.error("Run already exists with benchmarks");
    return redirect(`/resultsTable/${runId}`);
  }

  const ids = selection.split(",").map(Number);

  const routes = await prisma.rawRoute.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      startLat: true,
      startLon: true,
      destinationLat: true,
      destinationLon: true,
      referenceId: true,
    },
  });

  console.log("Fetched routes:", routes.length);

  for (const route of routes) {
    try {
      if (
        !route.startLat ||
        !route.startLon ||
        !route.destinationLat ||
        !route.destinationLon
      ) {
        console.error(`Invalid coordinates for route ID: ${route.id}`);
        continue;
      }

      console.log(`Processing route ID: ${route.id}`);
      const benchmarkResults = await fetchAllBenchmarks(
        route.startLat,
        route.startLon,
        route.destinationLat,
        route.destinationLon,
      );

      const benchmarkRecord = await prisma.benchmark.create({
        data: {
          rawRouteId: route.id,
          runId: runId,
        },
      });

      for (const benchmark of benchmarkResults) {
        const distanceCalculator = getDistanceCalculator(benchmark.name);
        const distanceResult = await distanceCalculator(benchmark.rawResponse);
        const totalDistance = distanceResult?.totalDistance || 0;
        const totalTollDistance = distanceResult?.totalTollDistance || 0;
        const tollDistances = distanceResult?.tollDistances || {};
        const distances = distanceResult?.distances || {};

        if (benchmark.name !== "") {
          await prisma.routingEngineResult.create({
            data: {
              benchmarkId: benchmarkRecord.id,
              name: benchmark.name,
              distance: benchmark.distance,
              calculatedDistance: totalDistance,
              tollDistanceByCountry: JSON.stringify(tollDistances),
              calculatedTollDistance: totalTollDistance,
              distanceByCountry: JSON.stringify(distances),
              duration: benchmark.time,
              rtt: benchmark.rtt,
              elevation: benchmark.elevation,
              geometry: JSON.stringify(benchmark.geometry),
              runId: runId,
            },
          });
          console.log(
            `Processed benchmark ${benchmark.name} : ${benchmark.distance}`,
          );
        }
      }
    } catch (error) {
      console.error(`Error processing route ID ${route.id}:`, error);
    }
  }

  console.log(`Redirecting to /resultsTable/${runId}`);
  return redirect(`/resultsTable/${runId}`);
}
