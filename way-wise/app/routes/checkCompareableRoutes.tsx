import { RawRoute } from "@prisma/client";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useState } from "react";

import fetchAllBenchmarks from "../benchmarkUtils/fetchAllBenchmarks";
import { prisma } from "../db.server";

interface LoaderData {
  rawRoutes: ExtendedRawRoute[];
  runIds: string[];
  rawRoutesCount: number;
}

interface ExtendedRawRoute extends RawRoute {
  status: "success" | "failure";
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const runIdParam = url.searchParams.get("runId");

  let runIds: string[] = [];
  if (runIdParam) {
    runIds = runIdParam.split(",").map((id) => id.trim());
  }

  let rawRoutes: RawRoute[] = [];
  const rawRoutesCount = await prisma.rawRoute.count();

  if (runIds.length > 0) {
    const runIdsInt = runIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (runIdsInt.length > 0) {
      const rawRoutesMap = new Map<number, RawRoute>();

      for (const runId of runIdsInt) {
        const routes = await prisma.rawRoute.findMany({
          where: {
            NOT: {
              benchmark: {
                some: {
                  runId: runId,
                  routingEngineResults: {
                    some: {},
                  },
                },
              },
            },
          },
        });

        routes.forEach((route) => {
          if (!rawRoutesMap.has(route.id)) {
            rawRoutesMap.set(route.id, route);
          }
        });
      }

      rawRoutes = Array.from(rawRoutesMap.values());
    }
  }

  return json({ rawRoutes, runIds, rawRoutesCount });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const runIds = formData.getAll("runId") as string[];
  const rawRoutes = JSON.parse(
    formData.get("rawRoutes") as string,
  ) as ExtendedRawRoute[];

  const results = await Promise.all(
    rawRoutes.map(async (route) => {
      try {
        const routingResults = await fetchAllBenchmarks(
          route.startLat,
          route.startLon,
          route.destinationLat,
          route.destinationLon,
        );
        return { ...route, routingResults, status: "success" };
      } catch (error) {
        return {
          ...route,
          routingResults: [],
          status: "failure",
        };
      }
    }),
  );

  return json({ results, runIds });
};

export default function RawRoutes() {
  const { rawRoutes, runIds, rawRoutesCount } = useLoaderData<LoaderData>();
  const actionData = useActionData<{
    results: ExtendedRawRoute[];
    runIds: string[];
  }>();
  const [inputRunIds, setInputRunIds] = useState(runIds.join(","));
  const transition = useNavigation();
  const isLoading = transition.state === "submitting";
  const routesToDisplay = actionData ? actionData.results : rawRoutes;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Check Raw Routes for Specific Runs
      </h1>

      <Form method="get" className="mb-4">
        <div className="flex items-center mb-2">
          <div className="block text-sm font-medium text-gray-700 mr-4">
            Run IDs (comma separated):
          </div>
          <input
            type="text"
            name="runId"
            value={inputRunIds}
            onChange={(e) => setInputRunIds(e.target.value)}
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

      {runIds.length > 0 ? (
        <Form method="post" className="mb-4">
          {runIds.map((id) => (
            <input key={id} type="hidden" name="runId" value={id} />
          ))}
          <input
            type="hidden"
            name="rawRoutes"
            value={JSON.stringify(rawRoutes)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 font-semibold rounded-lg shadow-md text-white ${
              isLoading ? "bg-gray-400" : "bg-green-500 hover:bg-green-700"
            }`}
          >
            {isLoading ? "Fetching Routes..." : "Fetch All Routes"}
          </button>
        </Form>
      ) : null}

      {routesToDisplay ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Raw Routes without Routing Engine Results for Runs{" "}
            {runIds.join(", ")}
          </h2>
          {routesToDisplay.length > 0 ? (
            <div>
              <div className="mb-2">
                <span className="font-bold">Failed Routes:</span>{" "}
                {routesToDisplay.length} of {rawRoutesCount}
              </div>
              <div className="overflow-x-auto">
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
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {routesToDisplay.map((route) => (
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
                          {route.status === "success" ? "Success" : "Failed"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No raw routes found for these runs.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
