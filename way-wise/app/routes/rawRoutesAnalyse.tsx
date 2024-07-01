//This is generated with Chat-GPT and fixed by a human

import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { prisma } from "../db.server";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface RawRouteWithReference {
  id: number;
  startLat: number;
  startLon: number;
  destinationLat: number;
  destinationLon: number;
  distance: number;
  distanceClass: string;
  regionClass: string;
  createdAt: Date;
  updatedAt: Date;
  reference: {
    durationValue: number;
    distanceValue: number;
  } | null;
}

interface LoaderData {
  distanceClasses: Record<string, number>;
  regionClasses: Record<string, number>;
  totalRoutes: number;
  meanDistanceRaw: number;
  medianDistanceRaw: number;
  totalDistanceRaw: number;
  meanDistanceReference: number;
  medianDistanceReference: number;
  totalDistanceReference: number;
  meanDuration: number;
  medianDuration: number;
  distancesRaw: number[];
  distancesReference: number[];
  durations: number[];
  classDistribution: Record<string, Record<string, number>>;
  shortClassAnalysis: {
    distribution: Record<string, number>;
    meanDistance: number;
    medianDistance: number;
    distances: number[];
  };
}

export const loader: LoaderFunction = async () => {
  const rawRoutes = await prisma.rawRoute.findMany({
    where: {
      reference: {
        isNot: null,
      },
      referenceId: {
        not: null,
      },
    },
    include: {
      reference: true,
    },
  });

  const distanceClasses: Record<string, number> = rawRoutes.reduce(
    (acc: Record<string, number>, route: RawRouteWithReference) => {
      acc[route.distanceClass] = (acc[route.distanceClass] || 0) + 1;
      return acc;
    },
    {},
  );

  const regionClasses: Record<string, number> = rawRoutes.reduce(
    (acc: Record<string, number>, route: RawRouteWithReference) => {
      acc[route.regionClass] = (acc[route.regionClass] || 0) + 1;
      return acc;
    },
    {},
  );

  const classDistribution: Record<string, Record<string, number>> = {};

  rawRoutes.forEach((route) => {
    if (!classDistribution[route.regionClass]) {
      classDistribution[route.regionClass] = {};
    }
    if (!classDistribution[route.regionClass][route.distanceClass]) {
      classDistribution[route.regionClass][route.distanceClass] = 0;
    }
    classDistribution[route.regionClass][route.distanceClass]++;
  });

  const distancesRaw: number[] = rawRoutes.map((route) => route.distance);
  const distancesReference: number[] = rawRoutes.map((route) =>
    route.reference ? route.reference.distanceValue : 0,
  );
  const durations: number[] = rawRoutes.map((route) =>
    route.reference ? route.reference.durationValue : 0,
  );

  const mean = (arr: number[]): number =>
    arr.reduce((sum, value) => sum + value, 0) / arr.length;

  const median = (arr: number[]): number => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const totalDistanceRaw = distancesRaw.reduce((acc, val) => acc + val, 0);
  const totalDistanceReference = distancesReference.reduce(
    (acc, val) => acc + val,
    0,
  );

  const meanDistanceRaw = mean(distancesRaw);
  const medianDistanceRaw = median(distancesRaw);

  const meanDistanceReference = mean(distancesReference);
  const medianDistanceReference = median(distancesReference);

  const meanDuration = mean(durations);
  const medianDuration = median(durations);

  // Analysis for short distance class
  const shortClassRoutes = rawRoutes.filter(
    (route) => route.distanceClass === "short",
  );

  const shortDistances: number[] = shortClassRoutes.map(
    (route) => route.distance,
  );
  const shortClassDistribution: Record<string, number> =
    shortClassRoutes.reduce(
      (acc: Record<string, number>, route: RawRouteWithReference) => {
        acc[route.regionClass] = (acc[route.regionClass] || 0) + 1;
        return acc;
      },
      {},
    );

  const meanDistanceShort = mean(shortDistances);
  const medianDistanceShort = median(shortDistances);

  return json<LoaderData>({
    distanceClasses,
    regionClasses,
    totalRoutes: rawRoutes.length,
    meanDistanceRaw,
    medianDistanceRaw,
    totalDistanceRaw,
    meanDistanceReference,
    medianDistanceReference,
    totalDistanceReference,
    meanDuration,
    medianDuration,
    distancesRaw,
    distancesReference,
    durations,
    classDistribution,
    shortClassAnalysis: {
      distribution: shortClassDistribution,
      meanDistance: meanDistanceShort,
      medianDistance: medianDistanceShort,
      distances: shortDistances,
    },
  });
};

const createHistogramData = (
  data: number[],
  binSize: number,
  label: string,
  color: string,
) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const bins = Math.ceil((max - min) / binSize);
  const counts = Array(bins).fill(0);

  data.forEach((value) => {
    const bin = Math.floor((value - min) / binSize);
    counts[bin]++;
  });

  const labels = Array.from({ length: bins }, (_, i) =>
    (min + i * binSize).toFixed(2),
  );

  return {
    labels,
    datasets: [
      {
        label,
        data: counts,
        borderColor: "black",
        lineTension: 0,
        fill: false,
        borderJoinStyle: "round",
        borderWidth: 0.2,
        barPercentage: 1,
        categoryPercentage: 1,
        hoverBackgroundColor: "darkgray",
        barThickness: "flex" as const,
        backgroundColor: color,
      },
    ],
  };
};

const baseColor = "rgba(54, 162, 235, 0.5)";

export default function RawRoutes() {
  const {
    distanceClasses,
    regionClasses,
    totalRoutes,
    meanDistanceRaw,
    medianDistanceRaw,
    totalDistanceRaw,
    meanDistanceReference,
    medianDistanceReference,
    totalDistanceReference,
    meanDuration,
    medianDuration,
    distancesRaw,
    distancesReference,
    durations,
    classDistribution,
    shortClassAnalysis,
  } = useLoaderData<LoaderData>();

  const distanceClassData = {
    labels: Object.keys(distanceClasses),
    datasets: [
      {
        label: "Number of Routes",
        data: Object.values(distanceClasses),
        backgroundColor: baseColor,
        borderColor: "black",
        borderWidth: 1,
      },
    ],
  };

  const regionClassData = {
    labels: Object.keys(regionClasses),
    datasets: [
      {
        label: "Number of Routes",
        data: Object.values(regionClasses),
        backgroundColor: baseColor,
        borderColor: "black",
        borderWidth: 1,
      },
    ],
  };

  const distanceHistogramDataRaw = createHistogramData(
    distancesRaw,
    10,
    "RawRoute Distances",
    baseColor,
  );
  const distanceHistogramDataReference = createHistogramData(
    distancesReference,
    10,
    "Reference Distances",
    baseColor,
  );
  const durationHistogramData = createHistogramData(
    durations,
    10,
    "Reference Durations",
    baseColor,
  );

  const classDistributionData = {
    labels: Object.keys(classDistribution),
    datasets: Object.keys(distanceClasses).map((distanceClass, index) => ({
      label: distanceClass,
      data: Object.keys(classDistribution).map(
        (regionClass) => classDistribution[regionClass][distanceClass] || 0,
      ),
      backgroundColor: `rgba(54, 162, 235, ${0.2 + 0.1 * (index % 6)})`,
      borderColor: "black",
      borderWidth: 1,
    })),
  };

  const shortClassDistributionData = {
    labels: Object.keys(shortClassAnalysis.distribution),
    datasets: [
      {
        label: "Number of Routes",
        data: Object.values(shortClassAnalysis.distribution),
        backgroundColor: baseColor,
        borderColor: "black",
        borderWidth: 1,
      },
    ],
  };

  const shortDistanceHistogramData = createHistogramData(
    shortClassAnalysis.distances,
    2,
    "Short Class Distances",
    baseColor,
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        RawRoute and Reference Analyses
      </h1>
      <div className="overflow-x-auto mb-10">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b">Metric</th>
              <th className="py-2 px-4 border-b">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">Total Routes</td>
              <td className="py-2 px-4 border-b">{totalRoutes}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Total Distance (RawRoute)</td>
              <td className="py-2 px-4 border-b">
                {totalDistanceRaw.toFixed(2)} km
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Total Distance (Reference)</td>
              <td className="py-2 px-4 border-b">
                {totalDistanceReference.toFixed(2)} km
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Mean Distance (RawRoute)</td>
              <td className="py-2 px-4 border-b">
                {meanDistanceRaw.toFixed(2)} km
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Median Distance (RawRoute)</td>
              <td className="py-2 px-4 border-b">
                {medianDistanceRaw.toFixed(2)} km
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Mean Distance (Reference)</td>
              <td className="py-2 px-4 border-b">
                {meanDistanceReference.toFixed(2)} km
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">
                Median Distance (Reference)
              </td>
              <td className="py-2 px-4 border-b">
                {medianDistanceReference.toFixed(2)} km
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Mean Duration (Reference)</td>
              <td className="py-2 px-4 border-b">
                {meanDuration.toFixed(2)} minutes
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">
                Median Duration (Reference)
              </td>
              <td className="py-2 px-4 border-b">
                {medianDuration.toFixed(2)} minutes
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Distance Classes</h2>
        <div className="bg-white p-4 shadow rounded-lg">
          <Bar
            data={distanceClassData}
            options={{
              scales: {
                x: { title: { display: true, text: "Distance Classes" } },
                y: { title: { display: true, text: "Number of Routes" } },
              },
            }}
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Region Classes</h2>
        <div className="bg-white p-4 shadow rounded-lg">
          <Bar
            data={regionClassData}
            options={{
              scales: {
                x: { title: { display: true, text: "Region Classes" } },
                y: { title: { display: true, text: "Number of Routes" } },
              },
            }}
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Distance Histogram (RawRoute)
        </h2>
        <div className="bg-white p-4 shadow rounded-lg">
          <Bar
            data={distanceHistogramDataRaw}
            options={{
              scales: {
                x: {
                  type: "linear",
                  title: { display: true, text: "Distance (km)" },
                },
                y: { title: { display: true, text: "Frequency" } },
              },
            }}
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Distance Histogram (Reference)
        </h2>
        <div className="bg-white p-4 shadow rounded-lg">
          <Bar
            data={distanceHistogramDataReference}
            options={{
              scales: {
                x: {
                  type: "linear",
                  title: { display: true, text: "Distance (km)" },
                },
                y: { title: { display: true, text: "Frequency" } },
              },
            }}
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Duration Histogram (Reference)
        </h2>
        <div className="bg-white p-4 shadow rounded-lg">
          <Bar
            data={durationHistogramData}
            options={{
              scales: {
                x: {
                  type: "linear",
                  title: { display: true, text: "Duration (minutes)" },
                },
                y: { title: { display: true, text: "Frequency" } },
              },
            }}
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Region vs Distance Class Distribution
        </h2>
        <div className="bg-white p-4 shadow rounded-lg">
          <Bar
            data={classDistributionData}
            options={{
              scales: {
                x: { title: { display: true, text: "Region Classes" } },
                y: { title: { display: true, text: "Number of Routes" } },
              },
            }}
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Analysis of Routes in Distance Class Short
        </h2>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b">Metric</th>
                <th className="py-2 px-4 border-b">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b">Mean Distance</td>
                <td className="py-2 px-4 border-b">
                  {shortClassAnalysis.meanDistance.toFixed(2)} km
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">Median Distance</td>
                <td className="py-2 px-4 border-b">
                  {shortClassAnalysis.medianDistance.toFixed(2)} km
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Region Distribution</h3>
          <div className="bg-white p-4 shadow rounded-lg">
            <Bar
              data={shortClassDistributionData}
              options={{
                scales: {
                  x: { title: { display: true, text: "Region Classes" } },
                  y: { title: { display: true, text: "Number of Routes" } },
                },
              }}
            />
          </div>
        </div>
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Distance Histogram</h3>
          <Bar
            data={shortDistanceHistogramData}
            options={{
              scales: {
                x: {
                  type: "linear",
                  title: { display: true, text: "Distance (km)" },
                },
                y: { title: { display: true, text: "Frequency" } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
