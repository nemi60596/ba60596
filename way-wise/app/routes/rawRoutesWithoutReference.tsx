import type { RawRoute } from "@prisma/client";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";

import { referenceRequest } from "../benchmarkUtils/referenceRequest";
import { prisma } from "../db.server";

interface LoaderData {
  rawRoutes: RawRoute[];
  rawRoutesCount: number;
  distanceClassCounts: Record<string, number>;
  regionClassCounts: Record<string, number>;
}

export const loader: LoaderFunction = async () => {
  const rawRoutesWithoutReference = await prisma.rawRoute.findMany({
    where: {
      OR: [{ referenceId: null }, { reference: null }],
    },
  });

  const rawRoutesCount = rawRoutesWithoutReference.length;

  const distanceClassCounts: Record<string, number> = {};
  const regionClassCounts: Record<string, number> = {};

  rawRoutesWithoutReference.forEach((route) => {
    if (distanceClassCounts[route.distanceClass]) {
      distanceClassCounts[route.distanceClass]++;
    } else {
      distanceClassCounts[route.distanceClass] = 1;
    }

    if (regionClassCounts[route.regionClass]) {
      regionClassCounts[route.regionClass]++;
    } else {
      regionClassCounts[route.regionClass] = 1;
    }
  });

  return json({
    rawRoutes: rawRoutesWithoutReference,
    rawRoutesCount,
    distanceClassCounts,
    regionClassCounts,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "checkReferences") {
    const rawRouteIds = formData.getAll("rawRouteIds") as string[];

    const routeIdsArray = rawRouteIds.flatMap((id) =>
      id.split(",").map((id) => id.trim()),
    );

    const results = await Promise.all(
      routeIdsArray.map(async (routeId) => {
        const route = await prisma.rawRoute.findUnique({
          where: { id: parseInt(routeId) },
        });

        if (!route) {
          return { routeId, success: false };
        }

        try {
          await referenceRequest(
            route.startLon,
            route.startLat,
            route.destinationLon,
            route.destinationLat,
          );
          return { routeId, success: true };
        } catch (error) {
          return { routeId, success: false };
        }
      }),
    );

    return json({ results });
  } else if (actionType === "checkDuplicates") {
    const rawRoutesWithoutReference = await prisma.rawRoute.findMany({
      where: {
        referenceId: null,
      },
    });

    const duplicates = [];

    for (let i = 0; i < rawRoutesWithoutReference.length; i++) {
      for (let j = i + 1; j < rawRoutesWithoutReference.length; j++) {
        const routeA = rawRoutesWithoutReference[i];
        const routeB = rawRoutesWithoutReference[j];

        const distanceStart = Math.sqrt(
          Math.pow(routeA.startLat - routeB.startLat, 2) +
            Math.pow(routeA.startLon - routeB.startLon, 2),
        );

        const distanceEnd = Math.sqrt(
          Math.pow(routeA.destinationLat - routeB.destinationLat, 2) +
            Math.pow(routeA.destinationLon - routeB.destinationLon, 2),
        );

        const threshold = 0.01; // Define an appropriate threshold for similarity

        if (distanceStart < threshold && distanceEnd < threshold) {
          duplicates.push({
            routeA: {
              id: routeA.id,
              startLat: routeA.startLat,
              startLon: routeA.startLon,
              destinationLat: routeA.destinationLat,
              destinationLon: routeA.destinationLon,
            },
            routeB: {
              id: routeB.id,
              startLat: routeB.startLat,
              startLon: routeB.startLon,
              destinationLat: routeB.destinationLat,
              destinationLon: routeB.destinationLon,
            },
          });
        }
      }
    }

    return json({ duplicates });
  }
};

export default function RawRoutesWithoutReference() {
  const { rawRoutes, rawRoutesCount, distanceClassCounts, regionClassCounts } =
    useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [referenceCheckResults, setReferenceCheckResults] = useState<
    Record<string, boolean>
  >({});
  const [duplicateResults, setDuplicateResults] = useState<
    { routeA: RawRoute; routeB: RawRoute }[]
  >([]);

  const handleCheckAllReferences = () => {
    fetcher.submit(
      {
        rawRouteIds: rawRoutes.map((route) => route.id.toString()),
        actionType: "checkReferences",
      },
      { method: "post" },
    );
  };

  const handleCheckDuplicates = () => {
    fetcher.submit(
      {
        actionType: "checkDuplicates",
      },
      { method: "post" },
    );
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.results) {
      const newResults = fetcher.data.results.reduce(
        (acc, { routeId, success }) => {
          acc[routeId] = success;
          return acc;
        },
        {},
      );
      setReferenceCheckResults((prevResults) => ({
        ...prevResults,
        ...newResults,
      }));
    }

    if (fetcher.data && fetcher.data.duplicates) {
      setDuplicateResults(fetcher.data.duplicates);
    }
  }, [fetcher.data]);

  const handleRouteClick = (routeA: RawRoute, routeB: RawRoute) => {
    const url = `/duplicateMap?routeAStartLat=${routeA.startLat}&routeAStartLon=${routeA.startLon}&routeADestLat=${routeA.destinationLat}&routeADestLon=${routeA.destinationLon}&routeBStartLat=${routeB.startLat}&routeBStartLon=${routeB.startLon}&routeBDestLat=${routeB.destinationLat}&routeBDestLon=${routeB.destinationLon}`;
    navigate(url);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Raw Routes Without Reference: {rawRoutesCount}
      </h1>

      {rawRoutes.length > 0 ? (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-medium">Distance Class Counts</h3>
            <ul className="list-disc list-inside">
              {Object.entries(distanceClassCounts).map(
                ([distanceClass, count]) => (
                  <li key={distanceClass}>
                    {distanceClass}: {count}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-medium">Region Class Counts</h3>
            <ul className="list-disc list-inside">
              {Object.entries(regionClassCounts).map(([regionClass, count]) => (
                <li key={regionClass}>
                  {regionClass}: {count}
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <button
              onClick={handleCheckAllReferences}
              className="px-4 py-2 m-2 font-semibold rounded-lg shadow-md text-white bg-blue-500 hover:bg-blue-700"
            >
              Check All References
            </button>
            <button
              type="button"
              className=" px-4 py-2 m-2 font-semibold rounded-lg shadow-md text-white bg-red-500 hover:bg-red-700"
              onClick={() => (window.location.href = "/addReferences")}
            >
              Add References
            </button>
            <button
              onClick={handleCheckDuplicates}
              className="px-4 py-2 m-2 font-semibold rounded-lg shadow-md text-white bg-yellow-500 hover:bg-yellow-700"
            >
              Check Duplicates
            </button>
          </div>
          {duplicateResults.length > 0 ? (
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                Duplicate Routes - {duplicateResults.length}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route A ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route A Start Coordinates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route A Destination Coordinates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route B ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route B Start Coordinates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route B Destination Coordinates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {duplicateResults.map(({ routeA, routeB }) => (
                      <tr key={`${routeA.id}-${routeB.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {routeA.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {routeA.startLat}, {routeA.startLon}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {routeA.destinationLat}, {routeA.destinationLon}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {routeB.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {routeB.startLat}, {routeB.startLon}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {routeB.destinationLat}, {routeB.destinationLon}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleRouteClick(routeA, routeB)}
                            className="text-blue-500 hover:underline"
                          >
                            View on Map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <h3 className="text-lg font-medium">
              Routes without Reference - {rawRoutes.length}
            </h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Latitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Longitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination Latitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination Longitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference Check
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rawRoutes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.startLat}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.startLon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.destinationLat}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.destinationLon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.distance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.distanceClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.regionClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(route.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(route.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {referenceCheckResults[route.id] === undefined ? (
                        <span className="text-gray-500">Not Checked</span>
                      ) : referenceCheckResults[route.id] ? (
                        <span className="text-green-500">Success</span>
                      ) : (
                        <span className="text-red-500">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          No raw routes found without reference.
        </p>
      )}
    </div>
  );
}
