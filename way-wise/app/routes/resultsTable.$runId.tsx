import { Prisma, RoutingEngineResult } from "@prisma/client";
import { LoaderFunction, json } from "@remix-run/node";
import { NavLink, useLoaderData } from "@remix-run/react";

import SelectableTable from "../components/selectableTable/SelectableTable";
import { prisma } from "../db.server";

interface LoaderData {
  routingEngineResults: RoutingEngineResultAdvanced[];
  runId: string | null;
  error: string | null;
  page: number;
  totalPages: number;
  allRouteIDs: number[];
}

interface RoutingEngineResultAdvanced extends RoutingEngineResult {
  mapLink: string;
  regionClass: string;
  distanceClass: string;
  referenceDuration: number;
  referenceDistance: number;
  rawRouteId: number;
}

type FilterConditions = Record<
  string,
  { equals?: number | string; contains?: string }
>;

async function getRoutingEngineResults(
  page: number,
  pageSize: number,
  regionClass?: string,
  runId?: number,
  benchmarkId?: number,
  filterConditions?: FilterConditions,
  orderBy?: Prisma.RoutingEngineResultOrderByWithRelationInput[],
): Promise<LoaderData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {};

  if (runId && !isNaN(runId)) {
    whereClause.benchmark = {
      run: {
        id: runId,
      },
    };
  }

  if (benchmarkId && !isNaN(benchmarkId)) {
    whereClause.benchmarkId = benchmarkId;
  }

  if (regionClass) {
    whereClause.benchmark = {
      ...whereClause.benchmark,
      rawRoute: {
        regionClass: {
          contains: regionClass,
        },
      },
    };
  }

  if (filterConditions) {
    Object.keys(filterConditions).forEach((field) => {
      const condition = filterConditions[field];
      const fieldSegments = field.split(".");
      let currentClause = whereClause;

      fieldSegments.forEach((segment, index) => {
        if (index === fieldSegments.length - 1) {
          currentClause[segment] = condition;
        } else {
          currentClause[segment] = currentClause[segment] || {};
          currentClause = currentClause[segment];
        }
      });
    });
  }

  const adjustedOrderBy = orderBy?.map((order) => {
    if (order.benchmark?.rawRoute?.id) {
      return { benchmark: { rawRoute: { id: order.benchmark.rawRoute?.id } } };
    }
    return order;
  });

  const [totalRoutes, routingEngineResults] = await Promise.all([
    prisma.routingEngineResult.count({ where: whereClause }),
    prisma.routingEngineResult.findMany({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        benchmark: {
          include: {
            run: true,
            rawRoute: {
              include: {
                reference: true,
              },
            },
          },
        },
      },
      orderBy: adjustedOrderBy,
    }),
  ]);

  const routingEngineResultsWithLinks: RoutingEngineResultAdvanced[] =
    routingEngineResults.map((result) => ({
      ...result,
      mapLink: `/geo/${result.benchmarkId}`,
      regionClass: result.benchmark.rawRoute.regionClass,
      distanceClass: result.benchmark.rawRoute.distanceClass,
      referenceDuration:
        result.benchmark.rawRoute.reference?.durationValue || 0,
      referenceDistance:
        result.benchmark.rawRoute.reference?.distanceValue || 0,
      rawRouteId: result.benchmark.rawRoute.id,
    }));

  const totalPages = Math.ceil(totalRoutes / pageSize);
  const allRouteIDs = (console.log("whereClause", whereClause),
  await prisma.routingEngineResult.findMany({
    where: whereClause,
    select: { id: true },
  })).map((route) => route.id);

  return {
    routingEngineResults: routingEngineResultsWithLinks,
    runId: runId ? runId.toString() : null,
    error: null,
    page,
    totalPages,
    allRouteIDs,
  };
}

export const loader: LoaderFunction = async ({
  params,
  request,
}): Promise<Response> => {
  const url = new URL(request.url);
  const runId = params.runId;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const sortField = url.searchParams.get("sortField") || "id";
  const sortOrder = (url.searchParams.get("sortOrder") ||
    "asc") as Prisma.SortOrder;
  const pageSize = 100;

  const filterConditions: FilterConditions = {};
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("filter_")) {
      const field = key.replace("filter_", "");

      if (field === "id") {
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
        filterConditions[`benchmark.rawRoute.${field}`] = { contains: value };
      } else if (field === "name") {
        filterConditions[field] = { contains: value };
      } else if (field === "benchmarkId") {
        const benchmarkIdValue = parseInt(value, 10);
        if (!isNaN(benchmarkIdValue)) {
          filterConditions[field] = { equals: benchmarkIdValue };
        }
      }
    }
  });

  const orderBy: Prisma.RoutingEngineResultOrderByWithRelationInput[] = [];

  if (
    [
      "regionClass",
      "distanceClass",
      "referenceDuration",
      "referenceDistance",
      "rawRouteId",
    ].includes(sortField)
  ) {
    if (
      sortField === "referenceDuration" ||
      sortField === "referenceDistance"
    ) {
      orderBy.push({
        benchmark: {
          rawRoute: {
            reference: {
              [sortField.replace("reference", "").toLowerCase() + "Value"]:
                sortOrder,
            },
          },
        },
      });
    } else if (sortField === "rawRouteId") {
      orderBy.push({ benchmark: { rawRoute: { id: sortOrder } } });
    } else {
      orderBy.push({ benchmark: { rawRoute: { [sortField]: sortOrder } } });
    }
  } else {
    orderBy.push({ [sortField]: sortOrder });
  }

  const loaderData = await getRoutingEngineResults(
    page,
    pageSize,
    filterConditions["benchmark.rawRoute.regionClass"]?.contains as string,
    runId ? parseInt(runId, 10) : undefined,
    filterConditions.benchmarkId?.equals as number,
    filterConditions,
    orderBy,
  );

  return json(loaderData);
};

export default function SelectRawRoutes() {
  const {
    routingEngineResults = [],
    runId,
    error,
    page,
    totalPages,
    allRouteIDs,
  } = useLoaderData<LoaderData>();

  const tableConfig = {
    headers: [
      {
        label: "ID RoutingEngineResults",
        field: "id" as const,
        sortable: true,
      },
      { label: "Name", field: "name" as const, sortable: true },
      { label: "Duration", field: "duration" as const, sortable: true },
      { label: "RTT", field: "rtt" as const, sortable: true },
      { label: "Distance", field: "distance" as const, sortable: true },
      {
        label: "Calculated Distance",
        field: "calculatedDistance" as const,
        sortable: true,
      },
      {
        label: "Toll Distance By Country",
        field: "tollDistanceByCountry" as const,
        sortable: true,
        visible: false,
      },
      {
        label: "Calculated Toll Distance",
        field: "calculatedTollDistance" as const,
        sortable: true,
      },
      {
        label: "Distance By Country",
        field: "distanceByCountry" as const,
        sortable: true,
      },
      { label: "Benchmark ID", field: "benchmarkId" as const, sortable: true },
      { label: "Region Class", field: "regionClass" as const, sortable: true }, // New column
      {
        label: "Distance Class",
        field: "distanceClass" as const,
        sortable: true,
      },
      {
        label: "Reference Duration",
        field: "referenceDuration" as const,
        sortable: true,
      },
      {
        label: "Reference Distance",
        field: "referenceDistance" as const,
        sortable: true,
      },
      { label: "Map Link", field: "mapLink" as const, sortable: false },
      { label: "Raw Route ID", field: "rawRouteId" as const, sortable: true },
    ],
    filterOptions: [
      { field: "name" as const, placeholder: "Filter by Name" },
      { field: "id" as const, placeholder: "Filter by Id" },
      {
        field: "distanceClass" as const,
        placeholder: "Filter by Distance Class",
      },
      { field: "regionClass" as const, placeholder: "Filter by Region Class" },
    ],
  };

  const renderRow = (
    result: RoutingEngineResultAdvanced,
    visibleFields: (keyof RoutingEngineResultAdvanced)[],
  ) => {
    return (
      <>
        {visibleFields.map((field) => (
          <td key={field} className="py-4 px-6">
            {field === "mapLink" ? (
              <NavLink
                className="text-blue-500 underline hover:text-blue-700"
                to={result.mapLink}
              >
                {`Map for Benchmark: ${result.benchmarkId}`}
              </NavLink>
            ) : (
              result[field]
            )}
          </td>
        ))}
      </>
    );
  };

  return (
    <SelectableTable
      rows={routingEngineResults}
      runId={runId}
      error={error}
      page={page}
      totalPages={totalPages}
      allRowIDs={allRouteIDs}
      renderRow={renderRow}
      idField="id"
      headers={tableConfig.headers}
      formAction="/savesnapshot"
      filterOptions={tableConfig.filterOptions}
      initialVisibleFields={[
        "id",
        "name",
        "duration",
        "distance",
        "regionClass",
        "distanceClass",
        "referenceDuration",
        "referenceDistance",
        "mapLink",
      ]}
    />
  );
}
