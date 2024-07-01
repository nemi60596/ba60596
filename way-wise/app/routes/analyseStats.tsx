//need to be refactored

import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import jStat from "jstat";

import DatasetTable from "../components/DatasetTable";
import { prisma } from "../db.server";

interface LoaderData {
  stats: {
    evaluatedAndRankedDatasets: EvaluatedAndRankedDataset[];
  };
  totalRoutes: totalRoutes;
  filteredResultsSize: filteredResultsSize;
  distribution: {
    distanceClass: Record<string, Record<string, number>>;
    regionClass: Record<string, Record<string, number>>;
  };
}
interface Distribution {
  distanceClass: Record<string, Record<string, number>>;
  regionClass: Record<string, Record<string, number>>;
}

interface DistributionByDistanceTableProps {
  distribution: Distribution;
}

interface DistributionByRegionTableProps {
  distribution: Distribution;
}
interface totalRoutes {
  OSRM: number;
  GraphHopper: number;
  Valhalla: number;
}

interface filteredResultsSize {
  OSRM: number;
  GraphHopper: number;
  Valhalla: number;
}

interface RouteData {
  name: string;
  rawRouteId: number;
  benchmarkId: number;
  distance: number;
  distanceClass: string;
  duration: number;
  meanReferenceSpeed: number;
  meanSpeed: number;
  referenceDistance: number;
  referenceDuration: number;
  regionClass: string;
  routinEngineResultId: number;
  rtt: number;
  runId: number;
}
interface SummaryTableProps {
  totalRoutes: totalRoutes;
  filteredResultsSize: filteredResultsSize;
}
interface GroupStats {
  distanceStats: StatsResult & { difference?: number; evaluation?: string };
  durationStats: StatsResult & { difference?: number; evaluation?: string };
  meanSpeedStats: StatsResult & { difference?: number; evaluation?: string };
  referenceDistanceStats: StatsResult;
  referenceDurationStats: StatsResult;
  meanReferenceSpeedStats: StatsResult;
  rttStats: StatsResult;
}

export interface StatsResult {
  mean: number;
  median: number;
  standardDeviation: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  mode: number[];
  normalDistribution: string;
  difference?: number;
  evaluation?: string;
  [key: string]: number | string | number[] | undefined;
}
interface DatasetDifference {
  group: string;
  distanceStats: StatsResult;
  referenceDistanceStats: StatsResult;
  distanceDifference: number;
  durationStats: StatsResult;
  referenceDurationStats: StatsResult;
  durationDifference: number;
  meanSpeedStats: StatsResult;
  referenceMeanSpeedStats: StatsResult;
  meanSpeedDifference: number;
}
interface EvaluatedAndRankedDataset {
  index: number;
  name: string;
  originalIndex: number;
  regionClassDifferences: DatasetDifference[];
  distanceClassDifferences: DatasetDifference[];
  overallDistanceStats: StatsResult;
  overallDurationStats: StatsResult;
  overallMeanSpeedStats: StatsResult;
  overallReferenceDistanceStats: StatsResult;
  overallReferenceDurationStats: StatsResult;
  overallMeanReferenceSpeedStats: StatsResult;
  overallRttStats: StatsResult;
}
function stats(arr: number[]): Promise<StatsResult> {
  return new Promise((resolve) => {
    const quartiles = jStat.quartiles(arr);
    const skewness = jStat.skewness(arr);
    const kurtosis = jStat.kurtosis(arr);
    const result: StatsResult = {
      mean: jStat.mean(arr),
      median: jStat.median(arr),
      standardDeviation: jStat.stdev(arr),
      q1: quartiles[0],
      q2: quartiles[1],
      q3: quartiles[2],
      iqr: quartiles[2] - quartiles[0],
      skewness: skewness,
      kurtosis: kurtosis,
      min: jStat.min(arr),
      max: jStat.max(arr),
      mode: jStat.mode(arr),
      normalDistribution:
        Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 0.5 ? "yes" : "no",
    };
    resolve(result);
  });
}

function evaluateDifference(difference: number): string {
  if (Math.abs(difference) <= 0) {
    return "good";
  } else if (Math.abs(difference) > 10) {
    return "bad";
  } else {
    return "acceptable";
  }
}

function generateUniqueNames(datasets: RouteData[][]): string[] {
  const nameCounts: Record<string, number> = {};

  return datasets.map((dataset) => {
    const baseName = dataset[0].name;
    if (!nameCounts[baseName]) {
      nameCounts[baseName] = 0;
    }
    nameCounts[baseName]++;
    return `${baseName} ${nameCounts[baseName]}`;
  });
}

async function calculateGroupedStats(
  data: RouteData[],
  groupBy: keyof RouteData,
) {
  const groupedData = data.reduce(
    (acc, obj) => {
      const key = obj[groupBy] as string;
      if (!acc[key]) acc[key] = [];
      acc[key].push(obj);
      return acc;
    },
    {} as Record<string, RouteData[]>,
  );

  const statsByGroup: Record<string, GroupStats> = {};

  for (const group in groupedData) {
    const groupData = groupedData[group];
    const distance = groupData.map((d) => d.distance);
    const duration = groupData.map((d) => d.duration);
    const meanSpeed = groupData.map((d) => d.meanSpeed);
    const referenceDistance = groupData.map((d) => d.referenceDistance);
    const referenceDuration = groupData.map((d) => d.referenceDuration);
    const meanReferenceSpeed = groupData.map((d) => d.meanReferenceSpeed);
    const rtt = groupData.map((d) => d.rtt);

    const distanceStats = await stats(distance);
    const durationStats = await stats(duration);
    const meanSpeedStats = await stats(meanSpeed);
    const referenceDistanceStats = await stats(referenceDistance);
    const referenceDurationStats = await stats(referenceDuration);
    const meanReferenceSpeedStats = await stats(meanReferenceSpeed);
    const rttStats = await stats(rtt);

    const distanceDifference = distanceStats.mean - referenceDistanceStats.mean;
    const durationDifference = durationStats.mean - referenceDurationStats.mean;
    const meanSpeedDifference =
      meanSpeedStats.mean - meanReferenceSpeedStats.mean;

    distanceStats.difference = distanceDifference;
    distanceStats.evaluation = evaluateDifference(distanceDifference);

    durationStats.difference = durationDifference;
    durationStats.evaluation = evaluateDifference(durationDifference);

    meanSpeedStats.difference = meanSpeedDifference;
    meanSpeedStats.evaluation = evaluateDifference(meanSpeedDifference);

    statsByGroup[group] = {
      distanceStats,
      durationStats,
      meanSpeedStats,
      referenceDistanceStats,
      referenceDurationStats,
      meanReferenceSpeedStats,
      rttStats,
    };
  }

  return statsByGroup;
}

export async function calculateStatistics(datasets: RouteData[][]) {
  const uniqueNames = generateUniqueNames(datasets);

  const results = await Promise.all(
    datasets.map(async (data, index) => {
      const convertedData = data.map((d) => ({
        ...d,
        duration: d.duration * 60,
        referenceDuration: d.referenceDuration * 60,
      }));

      const overallStats = await calculateGroupedStats(
        convertedData,
        "regionClass",
      );
      const distanceClassStats = await calculateGroupedStats(
        convertedData,
        "distanceClass",
      );

      const regionClassDifferences = Object.entries(overallStats).map(
        ([group, groupStats]) => ({
          group,
          distanceStats: groupStats.distanceStats,
          referenceDistanceStats: groupStats.referenceDistanceStats,
          distanceDifference: groupStats.distanceStats.difference,
          durationStats: groupStats.durationStats,
          referenceDurationStats: groupStats.referenceDurationStats,
          durationDifference: groupStats.durationStats.difference,
          meanSpeedStats: groupStats.meanSpeedStats,
          referenceMeanSpeedStats: groupStats.meanReferenceSpeedStats,
          meanSpeedDifference: groupStats.meanSpeedStats.difference,
        }),
      );

      const distanceClassDifferences = Object.entries(distanceClassStats).map(
        ([group, groupStats]) => ({
          group,
          distanceStats: groupStats.distanceStats,
          referenceDistanceStats: groupStats.referenceDistanceStats,
          distanceDifference: groupStats.distanceStats.difference,
          durationStats: groupStats.durationStats,
          referenceDurationStats: groupStats.referenceDurationStats,
          durationDifference: groupStats.durationStats.difference,
          meanSpeedStats: groupStats.meanSpeedStats,
          referenceMeanSpeedStats: groupStats.meanReferenceSpeedStats,
          meanSpeedDifference: groupStats.meanSpeedStats.difference,
        }),
      );

      const overallDistanceStats = await stats(
        convertedData.map((d) => d.distance),
      );
      const overallDurationStats = await stats(
        convertedData.map((d) => d.duration),
      );
      const overallMeanSpeedStats = await stats(
        convertedData.map((d) => d.meanSpeed),
      );
      const overallReferenceDistanceStats = await stats(
        convertedData.map((d) => d.referenceDistance),
      );
      const overallReferenceDurationStats = await stats(
        convertedData.map((d) => d.referenceDuration),
      );
      const overallMeanReferenceSpeedStats = await stats(
        convertedData.map((d) => d.meanReferenceSpeed),
      );
      const overallRttStats = await stats(convertedData.map((d) => d.rtt));

      return {
        datasetIndex: index,
        name: uniqueNames[index],
        regionClassDifferences,
        distanceClassDifferences,
        overallDistanceStats,
        overallDurationStats,
        overallMeanSpeedStats,
        overallReferenceDistanceStats,
        overallReferenceDurationStats,
        overallMeanReferenceSpeedStats,
        overallRttStats,
      };
    }),
  );

  return {
    evaluatedAndRankedDatasets: results.map((result, index) => ({
      index,
      name: result.name,
      originalIndex: result.datasetIndex,
      regionClassDifferences: result.regionClassDifferences,
      distanceClassDifferences: result.distanceClassDifferences,
      overallDistanceStats: result.overallDistanceStats,
      overallDurationStats: result.overallDurationStats,
      overallMeanSpeedStats: result.overallMeanSpeedStats,
      overallReferenceDistanceStats: result.overallReferenceDistanceStats,
      overallReferenceDurationStats: result.overallReferenceDurationStats,
      overallMeanReferenceSpeedStats: result.overallMeanReferenceSpeedStats,
      overallRttStats: result.overallRttStats,
    })),
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const snapshotId = parseInt(url.searchParams.get("snapshotId") || "0");
  if (snapshotId === 0) {
    return { snapshot: null };
  }

  const snapshot = await prisma.snapshot.findUnique({
    where: { id: snapshotId },
    select: {
      description: true,
      id: true,
      name: true,
      routeResults: {
        select: {
          name: true,
          rawRouteId: true,
          benchmarkId: true,
          distance: true,
          distanceClass: true,
          duration: true,
          meanReferenceSpeed: true,
          meanSpeed: true,
          referenceDistance: true,
          referenceDuration: true,
          regionClass: true,
          routinEngineResultId: true,
          rtt: true,
          runId: true,
        },
        where: {
          OR: [
            { name: { contains: "OSRM" } },
            { name: { contains: "GraphHopper" } },
            { name: { contains: "Valhalla" } },
          ],
        },
      },
      _count: {
        select: {
          routeResults: {
            where: {
              OR: [
                { name: { contains: "OSRM" } },
                { name: { contains: "GraphHopper" } },
                { name: { contains: "Valhalla" } },
              ],
            },
          },
        },
      },
    },
  });

  if (!snapshot) {
    return { snapshot: null };
  }

  const osrmResults = snapshot.routeResults.filter((result) =>
    result.name.includes("OSRM"),
  );
  const graphhopperResults = snapshot.routeResults.filter((result) =>
    result.name.includes("GraphHopper"),
  );
  const valhallaResults = snapshot.routeResults.filter((result) =>
    result.name.includes("Valhalla"),
  );

  const osrmRawRouteIds = new Set(
    osrmResults.map((result) => result.rawRouteId),
  );
  const graphhopperRawRouteIds = new Set(
    graphhopperResults.map((result) => result.rawRouteId),
  );
  const valhallaRawRouteIds = new Set(
    valhallaResults.map((result) => result.rawRouteId),
  );

  const commonRawRouteIds = [...osrmRawRouteIds].filter(
    (id) => graphhopperRawRouteIds.has(id) && valhallaRawRouteIds.has(id),
  );

  const filterByCommonRawRouteIds = (results: RouteData[]): RouteData[] =>
    results.filter((result) => commonRawRouteIds.includes(result.rawRouteId));

  const filteredOsrmResults = filterByCommonRawRouteIds(osrmResults);
  const filteredGraphhopperResults =
    filterByCommonRawRouteIds(graphhopperResults);
  const filteredValhallaResults = filterByCommonRawRouteIds(valhallaResults);

  const datasets: RouteData[][] = [
    filteredOsrmResults,
    filteredGraphhopperResults,
    filteredValhallaResults,
  ];
  const stats = await calculateStatistics(datasets);

  const totalRoutes = {
    OSRM: osrmResults.length,
    GraphHopper: graphhopperResults.length,
    Valhalla: valhallaResults.length,
  };

  const filteredResultsSize = {
    OSRM: filteredOsrmResults.length,
    GraphHopper: filteredGraphhopperResults.length,
    Valhalla: filteredValhallaResults.length,
  };

  const getClassDistribution = (results: RouteData[], key: keyof RouteData) => {
    return results.reduce(
      (acc, result) => {
        const indexKey = result[key] as unknown as string;
        acc[indexKey] = (acc[indexKey] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  const distribution = {
    distanceClass: {
      OSRM: getClassDistribution(filteredOsrmResults, "distanceClass"),
      GraphHopper: getClassDistribution(
        filteredGraphhopperResults,
        "distanceClass",
      ),
      Valhalla: getClassDistribution(filteredValhallaResults, "distanceClass"),
    },
    regionClass: {
      OSRM: getClassDistribution(filteredOsrmResults, "regionClass"),
      GraphHopper: getClassDistribution(
        filteredGraphhopperResults,
        "regionClass",
      ),
      Valhalla: getClassDistribution(filteredValhallaResults, "regionClass"),
    },
  };

  return {
    stats,
    totalRoutes,
    filteredResultsSize,
    distribution,
  };
}
const SummaryTable = ({
  totalRoutes,
  filteredResultsSize,
}: SummaryTableProps) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Routing Engine</th>
          <th>Total Routes</th>
          <th>Filtered Routes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>OSRM</td>
          <td>{totalRoutes.OSRM}</td>
          <td>{filteredResultsSize.OSRM}</td>
        </tr>
        <tr>
          <td>GraphHopper</td>
          <td>{totalRoutes.GraphHopper}</td>
          <td>{filteredResultsSize.GraphHopper}</td>
        </tr>
        <tr>
          <td>Valhalla</td>
          <td>{totalRoutes.Valhalla}</td>
          <td>{filteredResultsSize.Valhalla}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const DistributionByDistanceTable = ({
  distribution,
}: DistributionByDistanceTableProps) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">
      Distribution by Distance Class
    </h2>
    <table className="distribution-table">
      <thead>
        <tr>
          <th>Distance Class</th>
          <th>OSRM</th>
          <th>GraphHopper</th>
          <th>Valhalla</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(distribution.distanceClass.OSRM).map((key) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{distribution.distanceClass.OSRM[key]}</td>
            <td>{distribution.distanceClass.GraphHopper[key]}</td>
            <td>{distribution.distanceClass.Valhalla[key]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DistributionByRegionTable = ({
  distribution,
}: DistributionByRegionTableProps) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">Distribution by Region Class</h2>
    <table className="distribution-table">
      <thead>
        <tr>
          <th>Region Class</th>
          <th>OSRM</th>
          <th>GraphHopper</th>
          <th>Valhalla</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(distribution.regionClass.OSRM).map((key) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{distribution.regionClass.OSRM[key]}</td>
            <td>{distribution.regionClass.GraphHopper[key]}</td>
            <td>{distribution.regionClass.Valhalla[key]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
export default function AnalyseStats() {
  const { stats, totalRoutes, filteredResultsSize, distribution } =
    useLoaderData<LoaderData>();

  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="max-w-max p-5 mx-auto my-10 bg-white rounded-xl shadow-md">
        <h1 className="text-5xl font-bold text-blue-600 mb-4">
          Routing Engine Statistics
        </h1>
        <SummaryTable
          totalRoutes={totalRoutes}
          filteredResultsSize={filteredResultsSize}
        />
        <DistributionByDistanceTable distribution={distribution} />
        <DistributionByRegionTable distribution={distribution} />
        <DatasetTable
          evaluatedAndRankedDatasets={stats.evaluatedAndRankedDatasets}
        />
      </div>
    </main>
  );
}
