export interface AnalysisResult {
  mean: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
  isNormal: boolean;
  mode: number | number[];
  median: number;
  min: number;
  max: number;
  quartiles: { Q1: number; Q2: number; Q3: number };
  IQR: number;
}

export interface RouteResult {
  rtt: number;
  distanceClass: string;
  regionClass: string;
}

export function calculateMeanSpeed(distance: number, duration: number): number {
  return duration > 0 ? distance / (duration / 60) : 0;
}

function toFixed2(num: number | null | undefined): number {
  return num !== null && num !== undefined ? +num.toFixed(2) : 0;
}

function calculateMode(data: number[]): number | number[] {
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  data.forEach((item) => {
    frequency[item] = (frequency[item] || 0) + 1;
    maxFreq = Math.max(maxFreq, frequency[item]);
  });

  const modes = Object.keys(frequency)
    .filter((key) => frequency[+key] === maxFreq)
    .map(Number);
  return modes.length === 1 ? modes[0] : modes;
}

export function analyzeNormalDistribution(
  data: number[],
): AnalysisResult | null {
  if (data.length === 0) return null;

  const cleanData = data.map((val) => (val === null ? 0 : val));

  const sortedData = [...cleanData].sort((a, b) => a - b);
  const n = cleanData.length;
  const meanValue = toFixed2(cleanData.reduce((acc, val) => acc + val, 0) / n);
  const variance =
    cleanData.reduce((acc, val) => acc + Math.pow(val - meanValue, 2), 0) / n;
  const stdDev = toFixed2(Math.sqrt(variance));
  const skewness = toFixed2(
    cleanData.reduce((acc, val) => acc + Math.pow(val - meanValue, 3), 0) /
      (n * Math.pow(stdDev, 3)),
  );
  const kurtosis = toFixed2(
    cleanData.reduce((acc, val) => acc + Math.pow(val - meanValue, 4), 0) /
      (n * Math.pow(stdDev, 4)) -
      3,
  );
  const isNormal = Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 0.5;
  const medianValue = toFixed2(
    n % 2 !== 0
      ? sortedData[Math.floor(n / 2)]
      : (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2,
  );
  const modeValue = calculateMode(cleanData);
  const min = toFixed2(sortedData[0]);
  const max = toFixed2(sortedData[n - 1]);
  const Q1 = toFixed2(sortedData[Math.floor(n / 4)]);
  const Q2 = medianValue;
  const Q3 = toFixed2(sortedData[Math.floor((n * 3) / 4)]);
  const IQR = toFixed2(Q3 - Q1);

  return {
    mean: meanValue,
    standardDeviation: stdDev,
    skewness,
    kurtosis,
    isNormal,
    mode: modeValue,
    median: medianValue,
    min,
    max,
    quartiles: { Q1, Q2, Q3 },
    IQR,
  };
}

const classMap: Record<string, number> = {};

export function transformResults(
  results: RouteResult[],
): { rtt: number; distanceClass: number; regionClass: number }[] {
  let distanceClassCounter = 1;
  let regionClassCounter = 1;

  return results.map((result) => {
    if (!(result.distanceClass in classMap)) {
      classMap[result.distanceClass] = distanceClassCounter++;
    }
    if (!(result.regionClass in classMap)) {
      classMap[result.regionClass] = regionClassCounter++;
    }

    return {
      rtt: result.rtt,
      distanceClass: classMap[result.distanceClass],
      regionClass: classMap[result.regionClass],
    };
  });
}
