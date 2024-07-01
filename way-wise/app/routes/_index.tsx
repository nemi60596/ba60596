//The Dashboard is generated partially by Chat-GPT

import type { LoaderFunction } from "@remix-run/node";
import { NavLink, useLoaderData } from "@remix-run/react";
import { useState } from "react";

import { prisma } from "../db.server";

export const loader: LoaderFunction = async () => {
  const snapshots = await prisma.snapshot.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      routeResults: {
        distinct: ["runId"],
        select: {
          runId: true,
        },
      },
    },
  });
  const runs = await prisma.run.findMany({
    select: {
      id: true,
      createdAt: true,
      _count: {
        select: {
          benchmarks: true,
        },
      },
    },
  });
  return { snapshots, runs };
};

export default function Index() {
  const { snapshots, runs } = useLoaderData<{
    snapshots: {
      id: string;
      name: string;
      description: string;
      createdAt: Date;
      routeResults: {
        runId: string;
      }[];
    }[];
    runs: {
      id: string;
      createdAt: Date;
      _count: {
        benchmarks: number;
      };
    }[];
  }>();

  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);

  const displayedSnapshots = showAllSnapshots
    ? snapshots
    : snapshots.slice(0, 3);
  const displayedRuns = showAllRuns ? runs : runs.slice(0, 3);

  const handleSnapshotSelect = (snapshotId: string) => {
    setSelectedSnapshots((prevSelected) => {
      if (prevSelected.includes(snapshotId)) {
        return prevSelected.filter((id) => id !== snapshotId);
      } else {
        return [...prevSelected, snapshotId].slice(-2); // Ensure only two are selected
      }
    });
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-blue-600">
            Welcome to Way-Wise
          </h1>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <NavLink
              to="/addRawRoutes"
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1"
            >
              Add Raw Routes
            </NavLink>
            <NavLink
              to="/rttAnalyse"
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1"
            >
              RTT Analyse
            </NavLink>
            <NavLink
              to="/createRun"
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1"
            >
              Create a Run
            </NavLink>
            <NavLink
              to="/rawRoutesWithoutReference"
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1"
            >
              Check Raw Routes
            </NavLink>
          </div>
        </header>

        <section>
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-semibold text-gray-800">Snapshots</h2>
            <button
              onClick={() => setShowAllSnapshots(!showAllSnapshots)}
              className="text-blue-600 hover:underline"
            >
              {showAllSnapshots ? "Show Less" : "Show More"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {displayedSnapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-700">
                      {snapshot.name}
                    </h3>
                    <p className="text-gray-600 mt-2">{snapshot.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(snapshot.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
                    checked={selectedSnapshots.includes(snapshot.id)}
                    onChange={() => handleSnapshotSelect(snapshot.id)}
                  />
                </div>
                {snapshot.routeResults.map((routeResult, index) => (
                  <p key={index} className="text-sm text-gray-500 mt-2">
                    Related Run ID: {routeResult.runId}
                  </p>
                ))}
                <NavLink
                  to={`/analysestats?snapshotId=${snapshot.id}`}
                  className="inline-block mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1"
                >
                  View Analysis
                </NavLink>
              </div>
            ))}
          </div>
          {snapshots.length > 3 ? (
            <button
              onClick={() => setShowAllSnapshots(!showAllSnapshots)}
              className="mt-4 text-blue-600 hover:underline"
            >
              {showAllSnapshots ? "Show Less" : "Show More"}
            </button>
          ) : null}
          {selectedSnapshots.length < 2 ? (
            <div className="mt-6 text-center text-gray-600">
              Select snapshots to compare them
            </div>
          ) : (
            <div className="mt-6 text-center">
              <NavLink
                to={`/compareSnapshots?snapshotId=${selectedSnapshots[0]}&snapshotId=${selectedSnapshots[1]}`}
                className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1"
              >
                Compare Selected Snapshots
              </NavLink>
            </div>
          )}
        </section>

        <section>
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-semibold text-gray-800">Runs</h2>
            <button
              onClick={() => setShowAllRuns(!showAllRuns)}
              className="text-blue-600 hover:underline"
            >
              {showAllRuns ? "Show Less" : "Show More"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {displayedRuns.map((run) => (
              <div
                key={run.id}
                className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <p className="text-sm text-gray-500">
                  Run ID: {run.id} -{" "}
                  {new Date(run.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Benchmarks: {run._count.benchmarks}
                </p>
                <NavLink
                  to={`/resultsTable/${run.id}`}
                  className="inline-block mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1"
                >
                  Create Snapshot
                </NavLink>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
