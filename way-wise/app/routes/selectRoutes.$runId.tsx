import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import SelectableTable from "../components/selectableTable/SelectableTable";
import { prisma } from "../db.server";

interface RawRoute {
  id: number;
  startLat: number;
  startLon: number;
  destinationLat: number;
  destinationLon: number;
  distance: number;
  distanceClass: string;
  regionClass: string;
}

interface LoaderData {
  rawRoutes: RawRoute[];
  runId: string | null;
  error: string | null;
  page: number;
  totalPages: number;
  allRouteIDs: number[];
}

interface FilterConditions {
  startLat?: { equals: number };
  startLon?: { equals: number };
  destinationLat?: { equals: number };
  destinationLon?: { equals: number };
  id?: { equals: number };
  distance?: { equals: number };
  distanceClass?: { contains: string };
  regionClass?: { contains: string };
}

export const loader: LoaderFunction = async ({
  params,
  request,
}): Promise<Response> => {
  const url = new URL(request.url);
  const runId = params.runId;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const sortField = url.searchParams.get("sortField") || "id";
  const sortOrder = url.searchParams.get("sortOrder") || "asc";
  const pageSize = 100;

  if (!runId) {
    return json(
      { error: "No Run ID provided in the URL." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const filterConditions: FilterConditions = {};

  url.searchParams.forEach((value, key) => {
    if (key.startsWith("filter_")) {
      const field = key.replace("filter_", "") as keyof RawRoute;

      if (
        field === "startLat" ||
        field === "startLon" ||
        field === "destinationLat" ||
        field === "destinationLon"
      ) {
        const coordinateValue = parseFloat(value);
        if (!isNaN(coordinateValue)) {
          filterConditions[field] = { equals: coordinateValue };
        }
      } else if (field === "id") {
        const idValue = parseInt(value, 10);
        if (!isNaN(idValue)) {
          filterConditions[field] = { equals: idValue };
        }
      } else if (field === "distance") {
        const distanceValue = parseFloat(value);
        if (!isNaN(distanceValue)) {
          filterConditions[field] = { equals: distanceValue };
        }
      } else if (field === "distanceClass" || field === "regionClass") {
        filterConditions[field] = { contains: value };
      }
    }
  });

  const totalRoutes = await prisma.rawRoute.count({
    where: {
      ...filterConditions,
      reference: { NOT: undefined },
      referenceId: { not: null },
    },
  });

  const rawRoutes = await prisma.rawRoute.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    where: {
      ...filterConditions,
      reference: { NOT: undefined },
      referenceId: { not: null },
    },
    orderBy: {
      [sortField]: sortOrder,
    },
  });

  const totalPages = Math.ceil(totalRoutes / pageSize);
  const allRouteIDs = (
    await prisma.rawRoute.findMany({
      where: {
        reference: {
          isNot: null,
        },
        referenceId: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    })
  ).map((route) => route.id);

  return json({
    rawRoutes,
    runId,
    page,
    totalPages,
    allRouteIDs,
  });
};

export default function SelectRawRoutes() {
  const { rawRoutes, runId, error, page, totalPages, allRouteIDs } =
    useLoaderData<LoaderData>();

  const headers = [
    { label: "Route ID", field: "id" as keyof RawRoute, sortable: true },
    { label: "Start Lat", field: "startLat" as keyof RawRoute, sortable: true },
    { label: "Start Lon", field: "startLon" as keyof RawRoute, sortable: true },
    {
      label: "Destination Lat",
      field: "destinationLat" as keyof RawRoute,
      sortable: true,
    },
    {
      label: "Destination Lon",
      field: "destinationLon" as keyof RawRoute,
      sortable: true,
    },
    { label: "Distance", field: "distance" as keyof RawRoute, sortable: true },
    {
      label: "Distance Class",
      field: "distanceClass" as keyof RawRoute,
      sortable: true,
    },
    {
      label: "Region Class",
      field: "regionClass" as keyof RawRoute,
      sortable: true,
    },
  ];

  const filterOptions = [
    { field: "id", placeholder: "Filter by Route ID" },
    { field: "distanceClass", placeholder: "Filter by Distance Class" },
    { field: "regionClass", placeholder: "Filter by Region Class" },
  ] as { field: keyof RawRoute; placeholder: string }[];

  const renderRow = (route: RawRoute, visibleFields: (keyof RawRoute)[]) => (
    <>
      {visibleFields.includes("id") ? (
        <td className="py-4 px-6">{route.id}</td>
      ) : null}
      {visibleFields.includes("startLat") ? (
        <td className="py-4 px-6">{route.startLat}</td>
      ) : null}
      {visibleFields.includes("startLon") ? (
        <td className="py-4 px-6">{route.startLon}</td>
      ) : null}
      {visibleFields.includes("destinationLat") ? (
        <td className="py-4 px-6">{route.destinationLat}</td>
      ) : null}
      {visibleFields.includes("destinationLon") ? (
        <td className="py-4 px-6">{route.destinationLon}</td>
      ) : null}
      {visibleFields.includes("distance") ? (
        <td className="py-4 px-6">{route.distance.toFixed(2)} km</td>
      ) : null}
      {visibleFields.includes("distanceClass") ? (
        <td className="py-4 px-6">{route.distanceClass}</td>
      ) : null}
      {visibleFields.includes("regionClass") ? (
        <td className="py-4 px-6">{route.regionClass}</td>
      ) : null}
    </>
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <SelectableTable
          rows={rawRoutes}
          runId={runId}
          error={error}
          page={page}
          totalPages={totalPages}
          allRowIDs={allRouteIDs}
          renderRow={renderRow}
          idField="id"
          headers={headers}
          formAction="/benchmark"
          filterOptions={filterOptions}
          initialVisibleFields={[
            "id",
            "startLat",
            "startLon",
            "destinationLat",
            "destinationLon",
            "distance",
            "distanceClass",
            "regionClass",
          ]}
        />
      </div>
    </main>
  );
}
