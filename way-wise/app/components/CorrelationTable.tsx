import jStat from "jstat";

export default function CorrelationTable({
  dataPairs,
  description,
}: {
  dataPairs: number[][];
  description: string;
}) {
  if (dataPairs.length === 0) {
    return <p>Keine Daten vorhanden.</p>;
  }

  const results = calculateCorrelations(dataPairs, description);

  const interpret = (value: number) => {
    if (Math.abs(value) < 0.3) return "Schwach";
    if (Math.abs(value) < 0.7) return "Moderat";
    return "Stark";
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{results.description}</h3>
      <table className="table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2">Koeffizient</th>
            <th className="px-4 py-2">Wert</th>
            <th className="px-4 py-2">Interpretation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">Pearson</td>
            <td className="border px-4 py-2">{results.pearson.toFixed(2)}</td>
            <td className="border px-4 py-2">{interpret(results.pearson)}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Spearman</td>
            <td className="border px-4 py-2">{results.spearman.toFixed(2)}</td>
            <td className="border px-4 py-2">{interpret(results.spearman)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface CorrelationResults {
  description: string;
  pearson: number;
  spearman: number;
}

function calculateCorrelations(
  dataPairs: number[][],
  description: string,
): CorrelationResults {
  if (dataPairs.length === 0) {
    throw new Error("Die Datenliste darf nicht leer sein.");
  }
  const xData = dataPairs.map((pair) => pair[0]);
  const yData = dataPairs.map((pair) => pair[1]);
  const pearson = jStat.corrcoeff(xData, yData);
  const spearman = jStat.spearmancoeff(xData, yData);
  return {
    description,
    pearson,
    spearman,
  };
}
