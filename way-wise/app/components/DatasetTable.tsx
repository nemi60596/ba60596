//This Part is generated from Chat-GPT for testing purposes and fixed manually

import React from "react";

import { StatsResult } from "../routes/analyseStats";

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

interface Props {
  evaluatedAndRankedDatasets: EvaluatedAndRankedDataset[];
}

const evaluateDifference = (difference: number): string =>
  Math.abs(difference) <= 10 ? "ok" : "bad";
const evaluateDuration = (difference: number): string =>
  Math.abs(difference) <= 600 ? "ok" : "bad";

const renderTableHeader = () => (
  <thead>
    <tr>
      <th>Group</th>
      <th>Distance Stats Mean</th>
      <th>Distance Stats Median</th>
      <th>Reference Distance Stats Mean</th>
      <th>Distance Difference</th>
      <th>Distance Evaluation</th>
      <th>Duration Stats Mean</th>
      <th>Duration Stats Median</th>
      <th>Reference Duration Stats Mean</th>
      <th>Duration Difference</th>
      <th>Duration Evaluation</th>
      <th>Mean Speed Stats Mean</th>
      <th>Mean Speed Stats Median</th>
      <th>Reference Mean Speed Stats Mean</th>
      <th>Mean Speed Difference</th>
      <th>Mean Speed Evaluation</th>
    </tr>
  </thead>
);

const renderTableBody = (
  differences: DatasetDifference[],
  className: string,
) => (
  <tbody>
    {differences.map((diff, idx) => (
      <tr key={`${className}-${idx}`} className="text-center">
        <td>{diff.group}</td>
        <td>{diff.distanceStats?.mean?.toFixed(2)}</td>
        <td>{diff.distanceStats?.median?.toFixed(2)}</td>
        <td>{diff.referenceDistanceStats?.mean?.toFixed(2)}</td>
        <td>{diff.distanceDifference?.toFixed(2)}</td>
        <td
          style={{
            color:
              evaluateDifference(diff.distanceDifference) === "ok"
                ? "green"
                : "red",
          }}
        >
          {evaluateDifference(diff.distanceDifference)}
        </td>
        <td>{(diff.durationStats?.mean / 60).toFixed(0)}</td>
        <td>{(diff.durationStats?.median / 60).toFixed(0)}</td>
        <td>{(diff.referenceDurationStats?.mean / 60).toFixed(0)}</td>
        <td>{(diff.durationDifference / 60).toFixed(0)}</td>
        <td
          style={{
            color:
              evaluateDuration(diff.durationDifference) === "ok"
                ? "green"
                : "red",
          }}
        >
          {evaluateDuration(diff.durationDifference)}
        </td>
        <td>{diff.meanSpeedStats?.mean?.toFixed(2)}</td>
        <td>{diff.meanSpeedStats?.median?.toFixed(2)}</td>
        <td>{diff.referenceMeanSpeedStats?.mean?.toFixed(2)}</td>
        <td>{diff.meanSpeedDifference?.toFixed(2)}</td>
        <td
          style={{
            color:
              evaluateDifference(diff.meanSpeedDifference) === "ok"
                ? "green"
                : "red",
          }}
        >
          {evaluateDifference(diff.meanSpeedDifference)}
        </td>
      </tr>
    ))}
  </tbody>
);

const renderTable = (
  title: string,
  differences: DatasetDifference[],
  className: string,
) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <table className="table">
      {renderTableHeader()}
      {renderTableBody(differences, className)}
    </table>
  </div>
);

const renderOverallStatsTable = (dataset: EvaluatedAndRankedDataset) => {
  const {
    overallDistanceStats,
    overallReferenceDistanceStats,
    overallDurationStats,
    overallReferenceDurationStats,
    overallMeanSpeedStats,
    overallMeanReferenceSpeedStats,
    overallRttStats,
  } = dataset;

  const overallData = [
    { label: "Mean", key: "mean" },
    { label: "Median", key: "median" },
    { label: "Standard Deviation", key: "standardDeviation" },
    { label: "Q1", key: "q1" },
    { label: "Q2", key: "q2" },
    { label: "Q3", key: "q3" },
    { label: "IQR", key: "iqr" },
    { label: "Skewness", key: "skewness" },
    { label: "Kurtosis", key: "kurtosis" },
    { label: "Min", key: "min" },
    { label: "Max", key: "max" },
    { label: "Mode", key: "mode" },
    { label: "Normal Distribution", key: "normalDistribution" },
  ];

  const renderStat = (stats: StatsResult, key: string): string | null => {
    if (!stats) return null;
    const value = stats[key];

    if (key === "mode" && Array.isArray(value)) {
      if (value.length > 3) {
        return `${value.slice(0, 3).join(", ")}, ...`;
      }
      return value.length ? value.join(", ") : null;
    }
    if (key === "normalDistribution" && typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return value.toFixed(2);
    }

    return null;
  };

  const renderEvaluation = (
    data: {
      key: string;
      stats: StatsResult | null;
      refStats: StatsResult | null;
    },
    type: "distance" | "duration" | "speed",
  ): string | null => {
    if (data.key === "mean" || data.key === "median") {
      const difference =
        data.stats && data.refStats
          ? ((data.stats[data.key] as number) ?? 0) -
            ((data.refStats[data.key] as number) ?? 0)
          : null;

      if (difference === null) return null;

      if (type === "duration") {
        return evaluateDuration(difference);
      } else {
        return evaluateDifference(difference);
      }
    }
    return "-";
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">
        Overall Statistics for {dataset.name}
      </h2>
      <table>
        <thead>
          <tr>
            <th>Statistic</th>
            <th>Distance</th>
            <th>Reference Distance</th>
            <th>Distance Difference</th>
            <th>Distance Evaluation</th>
            <th>Duration</th>
            <th>Reference Duration</th>
            <th>Duration Difference</th>
            <th>Duration Evaluation</th>
            <th>Mean Speed</th>
            <th>Reference Mean Speed</th>
            <th>Mean Speed Difference</th>
            <th>Mean Speed Evaluation</th>
            <th>RTT</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {overallData.map((data, idx) => (
            <tr key={idx}>
              <td>{data.label}</td>
              <td>{renderStat(overallDistanceStats, data.key)}</td>
              <td>{renderStat(overallReferenceDistanceStats, data.key)}</td>
              <td>
                {overallDistanceStats && overallReferenceDistanceStats
                  ? (
                      ((overallDistanceStats[data.key] as number) ?? 0) -
                      ((overallReferenceDistanceStats[data.key] as number) ?? 0)
                    ).toFixed(2)
                  : null}
              </td>
              <td
                style={{
                  color:
                    data.key === "mean" || data.key === "median"
                      ? (overallDistanceStats &&
                          overallReferenceDistanceStats &&
                          evaluateDifference(
                            ((overallDistanceStats[data.key] as number) ?? 0) -
                              ((overallReferenceDistanceStats[
                                data.key
                              ] as number) ?? 0),
                          )) === "ok"
                        ? "green"
                        : "red"
                      : "black",
                }}
              >
                {renderEvaluation(
                  {
                    key: data.key,
                    stats: overallDistanceStats,
                    refStats: overallReferenceDistanceStats,
                  },
                  "distance",
                )}
              </td>
              <td>
                {(
                  parseFloat(renderStat(overallDurationStats, data.key) || "") /
                  60
                ).toFixed(0)}
              </td>
              <td>
                {(
                  parseFloat(
                    renderStat(overallReferenceDurationStats, data.key) || "",
                  ) / 60
                ).toFixed(0)}
              </td>
              <td>
                {overallDurationStats && overallReferenceDurationStats
                  ? (
                      (((overallDurationStats[data.key] as number) ?? 0) -
                        ((overallReferenceDurationStats[data.key] as number) ??
                          0)) /
                      60
                    ).toFixed(0)
                  : null}
              </td>
              <td
                style={{
                  color:
                    data.key === "mean" || data.key === "median"
                      ? (overallDurationStats &&
                          overallReferenceDurationStats &&
                          evaluateDuration(
                            ((overallDurationStats[data.key] as number) ?? 0) -
                              ((overallReferenceDurationStats[
                                data.key
                              ] as number) ?? 0),
                          )) === "ok"
                        ? "green"
                        : "red"
                      : "black",
                }}
              >
                {renderEvaluation(
                  {
                    key: data.key,
                    stats: overallDurationStats,
                    refStats: overallReferenceDurationStats,
                  },
                  "duration",
                )}
              </td>
              <td>{renderStat(overallMeanSpeedStats, data.key)}</td>
              <td>{renderStat(overallMeanReferenceSpeedStats, data.key)}</td>
              <td>
                {overallMeanSpeedStats && overallMeanReferenceSpeedStats
                  ? (
                      ((overallMeanSpeedStats[data.key] as number) ?? 0) -
                      ((overallMeanReferenceSpeedStats[data.key] as number) ??
                        0)
                    ).toFixed(2)
                  : null}
              </td>
              <td
                style={{
                  color:
                    data.key === "mean" || data.key === "median"
                      ? (overallMeanSpeedStats &&
                          overallMeanReferenceSpeedStats &&
                          evaluateDifference(
                            ((overallMeanSpeedStats[data.key] as number) ?? 0) -
                              ((overallMeanReferenceSpeedStats[
                                data.key
                              ] as number) ?? 0),
                          )) === "ok"
                        ? "green"
                        : "red"
                      : "black",
                }}
              >
                {renderEvaluation(
                  {
                    key: data.key,
                    stats: overallMeanSpeedStats,
                    refStats: overallMeanReferenceSpeedStats,
                  },
                  "speed",
                )}
              </td>
              <td>{renderStat(overallRttStats, data.key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderComparisonTable = (
  datasets: EvaluatedAndRankedDataset[],
  title: string,
  differences: (dataset: EvaluatedAndRankedDataset) => DatasetDifference[],
) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <table>
      <thead>
        <tr>
          <th>Dataset</th>
          <th>Group</th>
          <th>Distance Difference</th>
          <th>Distance Evaluation</th>
          <th>Duration Difference</th>
          <th>Duration Evaluation</th>
          <th>Mean Speed Difference</th>
          <th>Mean Speed Evaluation</th>
        </tr>
      </thead>
      <tbody>
        {datasets.map((dataset) =>
          differences(dataset).map((diff, index) => (
            <tr key={index} className="text-center">
              {index === 0 ? (
                <td rowSpan={differences(dataset).length}>{dataset.name}</td>
              ) : null}
              <td>{diff.group}</td>
              <td>{diff.distanceDifference?.toFixed(2)}</td>
              <td
                style={{
                  color:
                    evaluateDifference(diff.distanceDifference) === "ok"
                      ? "green"
                      : "red",
                }}
              >
                {evaluateDifference(diff.distanceDifference)}
              </td>
              <td>{(diff.durationDifference / 60).toFixed(0)}</td>
              <td
                style={{
                  color:
                    evaluateDuration(diff.durationDifference) === "ok"
                      ? "green"
                      : "red",
                }}
              >
                {evaluateDuration(diff.durationDifference)}
              </td>
              <td>{diff.meanSpeedDifference?.toFixed(2)}</td>
              <td
                style={{
                  color:
                    evaluateDifference(diff.meanSpeedDifference) === "ok"
                      ? "green"
                      : "red",
                }}
              >
                {evaluateDifference(diff.meanSpeedDifference)}
              </td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  </div>
);

const DatasetTable: React.FC<Props> = ({ evaluatedAndRankedDatasets }) => {
  if (!evaluatedAndRankedDatasets || evaluatedAndRankedDatasets.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <>
      {evaluatedAndRankedDatasets.map((dataset) => (
        <div key={dataset.index} className="mb-8">
          {renderTable(
            `Region Class Differences for ${dataset.name}`,
            dataset.regionClassDifferences,
            `region-${dataset.index}`,
          )}
          {renderTable(
            `Distance Class Differences for ${dataset.name}`,
            dataset.distanceClassDifferences,
            `distance-${dataset.index}`,
          )}
          {renderOverallStatsTable(dataset)}
        </div>
      ))}
      {renderComparisonTable(
        evaluatedAndRankedDatasets,
        "Comparison of Distance Class Differences",
        (dataset) => dataset.distanceClassDifferences,
      )}
      {renderComparisonTable(
        evaluatedAndRankedDatasets,
        "Comparison of Region Class Differences",
        (dataset) => dataset.regionClassDifferences,
      )}
    </>
  );
};

export default DatasetTable;
