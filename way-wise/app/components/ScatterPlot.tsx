//this is a scatter plot component that takes in data pairs and plots them on a scatter plot generated with Chat-GPT for testing purposes

import { Chart, ScatterDataPoint, ChartDataset } from "chart.js/auto";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useMemo, useCallback } from "react";

interface ScatterPlotProps {
  dataPairs: [number, number][];
  title: string;
  xLabel?: string;
  yLabel?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  dataPairs,
  title,
  xLabel = "X-Axis",
  yLabel = "Y-Axis",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"scatter", ScatterDataPoint[], unknown> | null>(
    null,
  );

  const calculateLinearRegression = useCallback((data: [number, number][]) => {
    const n = data.length;
    const sumX = data.reduce(
      (sum: number, pair: [number, number]) => sum + pair[0],
      0,
    );
    const sumY = data.reduce(
      (sum: number, pair: [number, number]) => sum + pair[1],
      0,
    );
    const sumXY = data.reduce(
      (sum: number, pair: [number, number]) => sum + pair[0] * pair[1],
      0,
    );
    const sumX2 = data.reduce(
      (sum: number, pair: [number, number]) => sum + pair[0] ** 2,
      0,
    );

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }, []);

  const scatterData = useMemo(
    () =>
      dataPairs.map((pair) => ({
        x: pair[0],
        y: pair[1],
      })),
    [dataPairs],
  );

  const { slope, intercept } = useMemo(
    () => calculateLinearRegression(dataPairs),
    [calculateLinearRegression, dataPairs],
  );

  const regressionLine: ChartDataset<"line", ScatterDataPoint[]> = useMemo(
    () => ({
      label: "Regression Line",
      data: [
        {
          x: Math.min(...dataPairs.map((pair) => pair[0])),
          y: intercept + slope * Math.min(...dataPairs.map((pair) => pair[0])),
        },
        {
          x: Math.max(...dataPairs.map((pair) => pair[0])),
          y: intercept + slope * Math.max(...dataPairs.map((pair) => pair[0])),
        },
      ],
      borderColor: "rgba(255, 99, 132, 1)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      type: "line",
      fill: false,
      pointRadius: 0,
      borderWidth: 1,
    }),
    [dataPairs, intercept, slope],
  );

  const destroyChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
  }, []);

  const createChart = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");

    if (ctx) {
      chartRef.current = new Chart(ctx, {
        type: "scatter",
        data: {
          datasets: [
            {
              label: title,
              data: scatterData,
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              pointRadius: 1,
              pointHoverRadius: 5,
            },
            regressionLine,
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: "linear",
              position: "bottom",
              title: {
                display: true,
                text: xLabel,
              },
            },
            y: {
              type: "linear",
              title: {
                display: true,
                text: yLabel,
              },
            },
          },
          elements: {
            point: {
              radius: 1,
            },
          },
          plugins: {
            tooltip: {
              mode: "nearest",
              intersect: false,
            },
            decimation: {
              enabled: true,
              algorithm: "min-max",
            },
          },
        },
      });
    }
  }, [title, scatterData, regressionLine, xLabel, yLabel]);

  useEffect(() => {
    destroyChart();
    createChart();

    return () => {
      destroyChart();
    };
  }, [
    scatterData,
    title,
    regressionLine,
    xLabel,
    yLabel,
    destroyChart,
    createChart,
  ]);

  return (
    <canvas ref={canvasRef} style={{ width: "100%", height: "400px" }}></canvas>
  );
};

ScatterPlot.propTypes = {
  dataPairs: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.number.isRequired)
      .isRequired as PropTypes.Validator<[number, number]>,
  ).isRequired,
  title: PropTypes.string.isRequired,
  xLabel: PropTypes.string,
  yLabel: PropTypes.string,
};

export default ScatterPlot;
