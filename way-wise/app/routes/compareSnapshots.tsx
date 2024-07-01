//buggy code below

import { useLoaderData } from "@remix-run/react";

import { prisma } from "../db.server";

import { calculateStatistics } from "./analyseStats";

interface RouteResult {
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

interface ComparisonResult {
  name: string;
  group: string;
  snapshot1: number;
  snapshot2: number;
  difference: number;
  evaluation: string;
  distanceClass?: string;
}

interface DistanceClassDifference {
  name: string;
  distanceClass: string;
  speed: ComparisonResult;
  duration: ComparisonResult;
  distance: ComparisonResult;
}

const filterResultsByName = (results: RouteResult[], name: string) =>
  results.filter((result) => result.name.includes(name));

const getCommonElements = (sets: Set<number>[]) => {
  const [firstSet, ...otherSets] = sets;
  return [...firstSet].filter((item) =>
    otherSets.every((set) => set.has(item)),
  );
};

const filterByCommonRawRouteIds = (
  results: RouteResult[],
  commonIds: number[],
) => results.filter((result) => commonIds.includes(result.rawRouteId));

async function getSnapshotData(snapshotId: number): Promise<{
  snapshotName: string;
  osrmResults: RouteResult[];
  graphhopperResults: RouteResult[];
  valhallaResults: RouteResult[];
} | null> {
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
    return null;
  }

  const osrmResults = filterResultsByName(snapshot.routeResults, "OSRM");
  const graphhopperResults = filterResultsByName(
    snapshot.routeResults,
    "GraphHopper",
  );
  const valhallaResults = filterResultsByName(
    snapshot.routeResults,
    "Valhalla",
  );

  const commonRawRouteIds = getCommonElements([
    new Set(osrmResults.map((result) => result.rawRouteId)),
    new Set(graphhopperResults.map((result) => result.rawRouteId)),
    new Set(valhallaResults.map((result) => result.rawRouteId)),
  ]);

  return {
    snapshotName: snapshot.name,
    osrmResults: filterByCommonRawRouteIds(osrmResults, commonRawRouteIds),
    graphhopperResults: filterByCommonRawRouteIds(
      graphhopperResults,
      commonRawRouteIds,
    ),
    valhallaResults: filterByCommonRawRouteIds(
      valhallaResults,
      commonRawRouteIds,
    ),
  };
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const snapshotIds = url.searchParams
    .getAll("snapshotId")
    .map((id) => parseInt(id));

  if (snapshotIds.length === 0) {
    return { snapshot: null };
  }

  const snapshotDataPromises = snapshotIds.map((id) => getSnapshotData(id));
  const snapshotsData = await Promise.all(snapshotDataPromises);

  const datasets1 = [
    snapshotsData[0]?.osrmResults,
    snapshotsData[0]?.graphhopperResults,
    snapshotsData[0]?.valhallaResults,
  ].filter(Boolean) as RouteResult[][];

  const stats1 = await calculateStatistics(datasets1);

  if (snapshotIds.length === 1) {
    return {
      stats: stats1,
      snapshotName1: snapshotsData[0]?.snapshotName,
    };
  }

  const datasets2 = [
    snapshotsData[1]?.osrmResults,
    snapshotsData[1]?.graphhopperResults,
    snapshotsData[1]?.valhallaResults,
  ].filter(Boolean) as RouteResult[][];

  const stats2 = await calculateStatistics(datasets2);

  const comparisonResults = compareStatsResults(stats1, stats2);

  return {
    comparisonResults,
    snapshotName1: snapshotsData[0]?.snapshotName,
    snapshotName2: snapshotsData[1]?.snapshotName,
  };
}

function evaluateDifference(snapshot1: number, snapshot2: number) {
  const absDiff1 = Math.abs(snapshot1);
  const absDiff2 = Math.abs(snapshot2);

  if (absDiff1 < absDiff2) {
    return "Snapshot 1 is better";
  } else if (absDiff1 > absDiff2) {
    return "Snapshot 2 is better";
  } else {
    return "Both snapshots are equally good";
  }
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function convertToMinutes(seconds: number): number {
  return seconds / 60;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compareStatsResults(stats1: any, stats2: any) {
  const comparisonResults: {
    distanceDifferences: ComparisonResult[];
    durationDifferences: ComparisonResult[];
    speedDifferences: ComparisonResult[];
    distanceClassDifferences: DistanceClassDifference[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overallStatistics: any[];
  } = {
    distanceDifferences: [],
    durationDifferences: [],
    speedDifferences: [],
    distanceClassDifferences: [],
    overallStatistics: [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats1.evaluatedAndRankedDatasets.forEach((dataset1: any, index: number) => {
    const dataset2 = stats2.evaluatedAndRankedDatasets[index];

    dataset1.regionClassDifferences.forEach(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (regionClassDiff1: any, regionIndex: number) => {
        const regionClassDiff2 = dataset2.regionClassDifferences[regionIndex];

        const distanceDifference: ComparisonResult = {
          name: dataset1.name,
          group: regionClassDiff1.group,
          snapshot1: regionClassDiff1.distanceDifference,
          snapshot2: regionClassDiff2.distanceDifference,
          difference:
            regionClassDiff2.distanceDifference -
            regionClassDiff1.distanceDifference,
          evaluation: evaluateDifference(
            regionClassDiff1.distanceDifference,
            regionClassDiff2.distanceDifference,
          ),
        };

        const durationDifference: ComparisonResult = {
          name: dataset1.name,
          group: regionClassDiff1.group,
          snapshot1: convertToMinutes(regionClassDiff1.durationDifference),
          snapshot2: convertToMinutes(regionClassDiff2.durationDifference),
          difference:
            convertToMinutes(regionClassDiff2.durationDifference) -
            convertToMinutes(regionClassDiff1.durationDifference),
          evaluation: evaluateDifference(
            regionClassDiff1.durationDifference,
            regionClassDiff2.durationDifference,
          ),
        };

        const speedDifference: ComparisonResult = {
          name: dataset1.name,
          group: regionClassDiff1.group,
          snapshot1: regionClassDiff1.meanSpeedDifference,
          snapshot2: regionClassDiff2.meanSpeedDifference,
          difference:
            regionClassDiff2.meanSpeedDifference -
            regionClassDiff1.meanSpeedDifference,
          evaluation: evaluateDifference(
            regionClassDiff1.meanSpeedDifference,
            regionClassDiff2.meanSpeedDifference,
          ),
        };

        comparisonResults.distanceDifferences.push(distanceDifference);
        comparisonResults.durationDifferences.push(durationDifference);
        comparisonResults.speedDifferences.push(speedDifference);
      },
    );

    dataset1.distanceClassDifferences.forEach(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (distanceClassDiff1: any, distanceClassIndex: number) => {
        const distanceClassDiff2 =
          dataset2.distanceClassDifferences[distanceClassIndex];

        const distanceClassDifference: DistanceClassDifference = {
          name: dataset1.name,
          distanceClass: distanceClassDiff1.group,
          speed: {
            name: dataset1.name,
            group: distanceClassDiff1.group,
            snapshot1: distanceClassDiff1.meanSpeedDifference,
            snapshot2: distanceClassDiff2.meanSpeedDifference,
            difference:
              distanceClassDiff2.meanSpeedDifference -
              distanceClassDiff1.meanSpeedDifference,
            evaluation: evaluateDifference(
              distanceClassDiff1.meanSpeedDifference,
              distanceClassDiff2.meanSpeedDifference,
            ),
          },
          duration: {
            name: dataset1.name,
            group: distanceClassDiff1.group,
            snapshot1: convertToMinutes(distanceClassDiff1.durationDifference),
            snapshot2: convertToMinutes(distanceClassDiff2.durationDifference),
            difference:
              convertToMinutes(distanceClassDiff2.durationDifference) -
              convertToMinutes(distanceClassDiff1.durationDifference),
            evaluation: evaluateDifference(
              distanceClassDiff1.durationDifference,
              distanceClassDiff2.durationDifference,
            ),
          },
          distance: {
            name: dataset1.name,
            group: distanceClassDiff1.group,
            snapshot1: distanceClassDiff1.distanceDifference,
            snapshot2: distanceClassDiff2.distanceDifference,
            difference:
              distanceClassDiff2.distanceDifference -
              distanceClassDiff1.distanceDifference,
            evaluation: evaluateDifference(
              distanceClassDiff1.distanceDifference,
              distanceClassDiff2.distanceDifference,
            ),
          },
        };

        comparisonResults.distanceClassDifferences.push(
          distanceClassDifference,
        );
      },
    );

    const overallStatDifference = {
      name: dataset1.name,
      snapshot1: {
        meanSpeed:
          dataset1.overallMeanSpeedStats.mean -
          dataset1.overallMeanReferenceSpeedStats.mean,
        duration: convertToMinutes(
          dataset1.overallDurationStats.mean -
            dataset1.overallReferenceDurationStats.mean,
        ),
        distance:
          dataset1.overallDistanceStats.mean -
          dataset1.overallReferenceDistanceStats.mean,
      },
      snapshot2: {
        meanSpeed:
          dataset2.overallMeanSpeedStats.mean -
          dataset2.overallMeanReferenceSpeedStats.mean,
        duration: convertToMinutes(
          dataset2.overallDurationStats.mean -
            dataset2.overallReferenceDurationStats.mean,
        ),
        distance:
          dataset2.overallDistanceStats.mean -
          dataset2.overallReferenceDistanceStats.mean,
      },
      difference: {
        meanSpeed:
          dataset2.overallMeanSpeedStats.mean -
          dataset1.overallMeanSpeedStats.mean,
        duration: convertToMinutes(
          dataset2.overallDurationStats.mean -
            dataset1.overallDurationStats.mean,
        ),
        distance:
          dataset2.overallDistanceStats.mean -
          dataset1.overallDistanceStats.mean,
      },
      evaluation: {
        meanSpeed: evaluateDifference(
          dataset1.overallMeanSpeedStats.mean,
          dataset2.overallMeanSpeedStats.mean,
        ),
        duration: evaluateDifference(
          dataset1.overallDurationStats.mean,
          dataset2.overallDurationStats.mean,
        ),
        distance: evaluateDifference(
          dataset1.overallDistanceStats.mean,
          dataset2.overallDistanceStats.mean,
        ),
      },
    };

    comparisonResults.overallStatistics.push(overallStatDifference);
  });

  return comparisonResults;
}

export default function SnapshotComparison() {
  const data = useLoaderData<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comparisonResults?: any;
    snapshotName1?: string;
    snapshotName2?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats?: any;
  }>();

  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <h1 className="text-5xl font-bold text-blue-600 mb-4">
          Snapshot Comparison Results
        </h1>
        {data.comparisonResults ? (
          <SnapshotSection
            title={`${data.snapshotName1} vs ${data.snapshotName2}`}
            comparisonResults={data.comparisonResults}
          />
        ) : null}
      </div>
    </main>
  );
}

const SnapshotSection = ({
  title,
  comparisonResults,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comparisonResults: any;
}) => (
  <div className="bg-white shadow rounded-lg p-6 mb-8">
    <h2 className="text-2xl font-semibold mb-4">{title}</h2>
    <div className="space-y-6">
      <SectionTable
        title="Distance Differences"
        items={comparisonResults.distanceDifferences}
      />
      <SectionTable
        title="Duration Differences"
        items={comparisonResults.durationDifferences}
      />
      <SectionTable
        title="Speed Differences"
        items={comparisonResults.speedDifferences}
      />
      <DistanceClassComparison
        items={comparisonResults.distanceClassDifferences}
      />
      <OverallStatistics items={comparisonResults.overallStatistics} />
    </div>
  </div>
);

const SectionTable = ({
  title,
  items,
}: {
  title: string;
  items: ComparisonResult[];
}) => (
  <div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Group</th>
          <th>Snapshot 1</th>
          <th>Snapshot 2</th>
          <th>Difference</th>
          <th>Evaluation</th>
        </tr>
      </thead>
      <tbody>
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.group || item.distanceClass}</td>
              <td>{formatNumber(item.snapshot1)}</td>
              <td>{formatNumber(item.snapshot2)}</td>
              <td>{formatNumber(item.difference)}</td>
              <td
                className={`${
                  item.evaluation === "Snapshot 1 is better"
                    ? "text-green-500"
                    : item.evaluation === "Snapshot 2 is better"
                      ? "text-red-500"
                      : "text-yellow-500"
                }`}
              >
                {item.evaluation}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6}>No data available</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const DistanceClassComparison = ({
  items,
}: {
  items: DistanceClassDifference[];
}) => (
  <div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      Distance Class Differences
    </h3>
    {items && items.length > 0 ? (
      <>
        <h4 className="font-semibold text-gray-800 mb-2">Speed</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Distance Class</th>
              <th>Snapshot 1</th>
              <th>Snapshot 2</th>
              <th>Difference</th>
              <th>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.distanceClass}</td>
                <td>{formatNumber(item.speed.snapshot1)}</td>
                <td>{formatNumber(item.speed.snapshot2)}</td>
                <td>{formatNumber(item.speed.difference)}</td>
                <td
                  className={`${
                    item.speed.evaluation === "Snapshot 1 is better"
                      ? "text-green-500"
                      : item.speed.evaluation === "Snapshot 2 is better"
                        ? "text-red-500"
                        : "text-yellow-500"
                  }`}
                >
                  {item.speed.evaluation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 className="font-semibold text-gray-800 mb-2">Duration</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Distance Class</th>
              <th>Snapshot 1</th>
              <th>Snapshot 2</th>
              <th>Difference</th>
              <th>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.distanceClass}</td>
                <td>{formatNumber(item.duration.snapshot1)}</td>
                <td>{formatNumber(item.duration.snapshot2)}</td>
                <td>{formatNumber(item.duration.difference)}</td>
                <td
                  className={`${
                    item.duration.evaluation === "Snapshot 1 is better"
                      ? "text-green-500"
                      : item.duration.evaluation === "Snapshot 2 is better"
                        ? "text-red-500"
                        : "text-yellow-500"
                  }`}
                >
                  {item.duration.evaluation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 className="font-semibold text-gray-800 mb-2">Distance</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Distance Class</th>
              <th>Snapshot 1</th>
              <th>Snapshot 2</th>
              <th>Difference</th>
              <th>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.distanceClass}</td>
                <td>{formatNumber(item.distance.snapshot1)}</td>
                <td>{formatNumber(item.distance.snapshot2)}</td>
                <td>{formatNumber(item.distance.difference)}</td>
                <td
                  className={`${
                    item.distance.evaluation === "Snapshot 1 is better"
                      ? "text-green-500"
                      : item.distance.evaluation === "Snapshot 2 is better"
                        ? "text-red-500"
                        : "text-yellow-500"
                  }`}
                >
                  {item.distance.evaluation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ) : (
      <div className="text-gray-500">No data available</div>
    )}
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OverallStatistics = ({ items }: { items: any[] }) => (
  <div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      Overall Statistics Differences
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items && items.length > 0 ? (
        items.map((diff, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-lg border border-gray-200"
          >
            <div className="font-semibold text-gray-800 mb-4">{diff.name}</div>
            <StatisticCard
              name="Speed"
              snapshot1={formatNumber(diff.snapshot1.meanSpeed)}
              snapshot2={formatNumber(diff.snapshot2.meanSpeed)}
              difference={formatNumber(diff.difference.meanSpeed)}
              evaluation={diff.evaluation.meanSpeed}
            />
            <StatisticCard
              name="Duration"
              snapshot1={formatNumber(diff.snapshot1.duration)}
              snapshot2={formatNumber(diff.snapshot2.duration)}
              difference={formatNumber(diff.difference.duration)}
              evaluation={diff.evaluation.duration}
            />
            <StatisticCard
              name="Distance"
              snapshot1={formatNumber(diff.snapshot1.distance)}
              snapshot2={formatNumber(diff.snapshot2.distance)}
              difference={formatNumber(diff.difference.distance)}
              evaluation={diff.evaluation.distance}
            />
          </div>
        ))
      ) : (
        <div className="text-gray-500">No data available</div>
      )}
    </div>
  </div>
);

const StatisticCard = ({
  name,
  snapshot1,
  snapshot2,
  difference,
  evaluation,
}: {
  name: string;
  snapshot1: string;
  snapshot2: string;
  difference: string;
  evaluation: string;
}) => (
  <div className="mb-4">
    <h4 className="font-semibold text-gray-700 mb-2">{name}</h4>
    <div className="text-gray-700">
      <div className="flex justify-between">
        <span className="font-medium">Snapshot 1:</span>
        <span>{snapshot1}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Snapshot 2:</span>
        <span>{snapshot2}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Difference:</span>
        <span>{difference}</span>
      </div>
      <div
        className={`${
          evaluation === "Snapshot 1 is better"
            ? "text-green-500"
            : evaluation === "Snapshot 2 is better"
              ? "text-red-500"
              : "text-yellow-500"
        }`}
      >
        ({evaluation})
      </div>
    </div>
  </div>
);
