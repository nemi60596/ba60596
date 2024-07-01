import { ResultsRoute } from "@prisma/client";
import { json, LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import jStat from "jstat";
import React, { useState, useMemo, useCallback, Suspense, lazy } from "react";

import { analyzeNormalDistribution } from "../components/StatsComponents"; // Pseudo-import
import { prisma } from "../db.server";

const ScatterPlot = lazy(() => import("../components/ScatterPlot"));

interface RttDataset {
  rtt: number;
  distance: number;
  duration: number;
  name: string;
}

interface CorrelationResult {
  description: string;
  spearman: number;
  dataPairs: number[][];
}

interface AnalysisResult {
  mean: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
  isNormal: boolean;
  mode: number;
  median: number;
  min: number;
  max: number;
  quartiles: {
    Q1: number;
    Q2: number;
    Q3: number;
  };
  IQR: number;
}

interface NormalizedResult {
  mean: number;
  median: number;
}

interface LoaderData {
  CorrelationResults: CorrelationResult[];
  snapshotIds: string[];
  AnalysisResults: Record<string, AnalysisResult>;
  NormalizedResults: Record<string, NormalizedResult>;
}

function calculateCorrelation(
  dataPairs: number[][],
  description: string,
): CorrelationResult {
  if (dataPairs.length === 0) {
    throw new Error("Die Datenliste darf nicht leer sein.");
  }
  const xData = dataPairs.map((pair) => pair[0]);
  const yData = dataPairs.map((pair) => pair[1]);
  const spearman = jStat.spearmancoeff(xData, yData);
  return {
    description,
    spearman,
    dataPairs,
  };
}

const normalizeValues = (data: number[]) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return data.map((value) => (value - min) / (max - min));
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const snapshotIdParam = url.searchParams.get("snapshotId");

  const snapshotIds = snapshotIdParam?.split(",").map((id) => id.trim()) || [];

  const routeResults: ResultsRoute[] = [];
  if (snapshotIds.length > 0) {
    const snapshotIdsInt = snapshotIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (snapshotIdsInt.length > 0) {
      for (const snapshotId of snapshotIdsInt) {
        const snapshot = await prisma.snapshot.findUnique({
          where: {
            id: snapshotId,
          },
          include: {
            routeResults: true,
          },
        });
        if (snapshot) {
          routeResults.push(...snapshot.routeResults);
        }
      }
    }
  }
  const rttByRunAndName: Record<number, Record<string, RttDataset[]>> = {};
  let postRttSum = 0;
  let postRttCount = 0;

  if (routeResults.length > 0) {
    for (const route of routeResults) {
      if (!rttByRunAndName[route.runId]) {
        rttByRunAndName[route.runId] = {};
      }
      if (!rttByRunAndName[route.runId][route.name]) {
        rttByRunAndName[route.runId][route.name] = [];
      }
      rttByRunAndName[route.runId][route.name].push({
        rtt: route.rtt,
        distance: route.distance,
        duration: route.duration,
        name: route.name,
      });

      if (route.name.includes("valhalla")) {
        postRttSum += route.rtt;
        postRttCount++;
      }
    }
  }

  const postRttAverage = postRttCount > 0 ? postRttSum / postRttCount : 0;

  Object.values(rttByRunAndName).forEach((run) => {
    Object.values(run).forEach((datasets) => {
      datasets.forEach((dataset) => {
        if (dataset.name.includes("valhalla")) {
          dataset.rtt -= postRttAverage;
        }
      });
    });
  });

  const CorrelationResults = Object.entries(rttByRunAndName).flatMap(
    ([runId, run]) =>
      Object.entries(run).flatMap(([name, data]) => [
        calculateCorrelation(
          data.map((d) => [d.rtt, d.distance]),
          `Run ID: ${runId}, Name: ${name}, Dataset: RTT vs Distance`,
        ),
        calculateCorrelation(
          data.map((d) => [d.rtt, d.duration]),
          `Run ID: ${runId}, Name: ${name}, Dataset: RTT vs Duration`,
        ),
      ]),
  );

  const AnalysisResults = Object.entries(rttByRunAndName).reduce(
    (acc, [runId, run]) => {
      Object.entries(run).forEach(([name, data]) => {
        const rttData = data.map((d) => d.rtt);
        acc[`${runId}-${name}`] = analyzeNormalDistribution(rttData);
      });
      return acc;
    },
    {} as Record<string, AnalysisResult | null>,
  );

  const allMeans = Object.values(AnalysisResults)
    .filter((result): result is AnalysisResult => result !== null)
    .map((result) => result.mean);
  const allMedians = Object.values(AnalysisResults)
    .filter((result): result is AnalysisResult => result !== null)
    .map((result) => result.median);

  const normalizedMeans = normalizeValues(allMeans);
  const normalizedMedians = normalizeValues(allMedians);

  const NormalizedResults = Object.keys(AnalysisResults).reduce(
    (acc, key, index) => {
      acc[key] = {
        mean: normalizedMeans[index],
        median: normalizedMedians[index],
      };
      return acc;
    },
    {} as Record<string, NormalizedResult>,
  );

  return json<LoaderData>({
    CorrelationResults,
    snapshotIds,
    AnalysisResults: AnalysisResults as Record<string, AnalysisResult>,
    NormalizedResults,
  });
};

interface TableProps {
  columns: string[];
  data: (string | number)[][];
}

const Table: React.FC<TableProps> = ({ columns, data }) => (
  <div className="overflow-x-auto">
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {row.map((cell, i) => (
              <td key={i}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function RttAnalyse() {
  const {
    CorrelationResults,
    snapshotIds,
    AnalysisResults,
    NormalizedResults,
  } = useLoaderData<LoaderData>();
  const [inputSnapshotIds, setInputSnapshotIds] = useState(
    snapshotIds.length > 0 ? snapshotIds.join(", ") : "",
  );
  const transition = useNavigation();
  const isLoading = transition.state === "submitting";
  const [collapsed, setCollapsed] = useState(
    Array(CorrelationResults.length).fill(true),
  );

  const toggleCollapse = (index: number) => {
    setCollapsed((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const interpret = useCallback((value: number) => {
    if (Math.abs(value) < 0.3) return "Schwach";
    if (Math.abs(value) < 0.7) return "Moderat";
    return "Stark";
  }, []);

  const correlationData = useMemo(
    () =>
      CorrelationResults.map((result) => [
        result.description,
        result.spearman.toFixed(2),
        interpret(result.spearman),
      ]),
    [CorrelationResults, interpret],
  );

  const analysisData = useMemo(
    () =>
      Object.entries(AnalysisResults).map(([key, result]) => [
        key,
        result.mean.toFixed(2),
        result.standardDeviation.toFixed(2),
        result.skewness.toFixed(2),
        result.kurtosis.toFixed(2),
        result.isNormal ? "Yes" : "No",
        result.median.toFixed(2),
        result.min.toFixed(2),
        result.max.toFixed(2),
        result.quartiles.Q1.toFixed(2),
        result.quartiles.Q2.toFixed(2),
        result.quartiles.Q3.toFixed(2),
        result.IQR.toFixed(2),
      ]),
    [AnalysisResults],
  );

  const normalizedData = useMemo(
    () =>
      Object.entries(NormalizedResults).map(([key, result]) => [
        key,
        result.mean.toFixed(2),
        result.median.toFixed(2),
      ]),
    [NormalizedResults],
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <div className="p-5 max-w-8xl mx-auto my-10 bg-white rounded-xl shadow-md">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            Select Snapshots for Analysis
          </h1>
          <Form method="get" className="mb-4">
            <div className="flex items-center">
              <div className="block text-sm font-medium text-gray-700 mr-4">
                Snapshot Ids (comma separated):
              </div>
              <input
                type="text"
                name="snapshotId"
                value={inputSnapshotIds}
                onChange={(e) => setInputSnapshotIds(e.target.value)}
                className="mr-4 p-2 border border-gray-300 rounded"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 font-semibold rounded-lg shadow-md text-white ${
                  isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Loading..." : "Check"}
              </button>
            </div>
          </Form>
          <h2 className="text-xl font-semibold mb-2">Correlation Results</h2>
          <Table
            columns={["Description", "Spearman", "Interpretation"]}
            data={correlationData}
          />
          <h2 className="text-xl font-semibold mb-2 mt-4">Analysis Results</h2>
          <Table
            columns={[
              "Dataset",
              "Mean",
              "Std Dev",
              "Skewness",
              "Kurtosis",
              "Normal",
              "Median",
              "Min",
              "Max",
              "Q1",
              "Q2",
              "Q3",
              "IQR",
            ]}
            data={analysisData}
          />
          <h2 className="text-xl font-semibold mb-2 mt-4">
            Normalized Results
          </h2>
          <Table
            columns={["Dataset", "Normalized Mean", "Normalized Median"]}
            data={normalizedData}
          />
          <h2 className="text-xl font-semibold mb-2 mt-4">Scatterplots</h2>
          {CorrelationResults.map((result, index) => (
            <div key={index} className="mb-4">
              <button
                className="text-lg font-medium mb-2 cursor-pointer"
                onClick={() => toggleCollapse(index)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") toggleCollapse(index);
                }}
                aria-expanded={!collapsed[index]}
              >
                {result.description}
              </button>
              {!collapsed[index] ? (
                <div style={{ width: "1200px", height: "600px" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <ScatterPlot
                      dataPairs={result.dataPairs}
                      title={result.description}
                      xLabel={result.description.split(" vs ")[0]}
                      yLabel={result.description.split(" vs ")[1]}
                    />
                  </Suspense>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
