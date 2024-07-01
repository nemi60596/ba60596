import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";

import Spinner from "../components/Spinner";
import { prisma } from "../db.server";

export interface Snapshot {
  routinEngineResultId: number;
  runId: number;
  benchmarkId: number;
  rawRouteId: number;
  referenceDistance: number;
  referenceDuration: number;
  meanReferenceSpeed: number;
  name: string;
  distance: number;
  duration: number;
  meanSpeed: number;
  rtt: number;
  distanceClass: string;
  regionClass: string;
  referenceTollDistance: number;
  referenceGeometries: string;
  geometries: string;
  tollDistance: number;
}

const calculateMeanSpeed = (distance: number, duration: number): number =>
  duration > 0 ? distance / (duration / 60) : 0;

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const allRowsSelected = formData.get("allRowsSelected");
  if (allRowsSelected === "true") {
    const runId = parseInt(formData.get("runId")?.toString() || "0");
    return redirect(`/savesnapshot?runId=${runId}`);
  } else if (allRowsSelected === "false") {
    const selectedRows =
      formData.get("selectedRows")?.toString().split(",") || [];

    if (selectedRows.length > 0) {
      return redirect(`/savesnapshot?selectedIds=${selectedRows.join(",")}`);
    }
  }

  if (formData.get("_action") === "saveData") {
    const url = new URL(request.url);
    const runId = parseInt(url.searchParams.get("runId") || "0");
    const selectedIds =
      url.searchParams
        .get("selectedIds")
        ?.split(",")
        .map((id) => parseInt(id)) || [];
    let whereClause = {};

    if (runId !== 0) {
      whereClause = { runId: runId };
    } else if (selectedIds.length > 0) {
      whereClause = { id: { in: selectedIds } };
    } else {
      return redirect("/analysis?error=No+results+selected+for+snapshot");
    }
    const data = await prisma.routingEngineResult.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        rtt: true,
        distance: true,
        duration: true,

        benchmark: {
          select: {
            id: true,
            run: { select: { id: true } },
            rawRoute: {
              select: {
                id: true,
                regionClass: true,
                distanceClass: true,
                reference: {
                  select: {
                    id: true,
                    distanceValue: true,
                    durationValue: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const results: Snapshot[] = data.map((result) => ({
      routinEngineResultId: result.id,
      runId: result.benchmark.run.id,
      benchmarkId: result.benchmark.id,
      rawRouteId: result.benchmark.rawRoute.id,
      referenceDistance:
        result.benchmark.rawRoute.reference?.distanceValue || 0,
      referenceDuration:
        result.benchmark.rawRoute.reference?.durationValue || 0,
      meanReferenceSpeed: calculateMeanSpeed(
        result.benchmark.rawRoute.reference?.distanceValue || 0,
        result.benchmark.rawRoute.reference?.durationValue || 0,
      ),
      referenceTollDistance: 0,
      referenceGeometries: "",
      name: result.name,
      distance: result.distance,
      duration: result.duration,
      meanSpeed: calculateMeanSpeed(result.distance, result.duration),
      rtt: result.rtt,
      geometries: "",
      distanceClass: result.benchmark.rawRoute.distanceClass,
      regionClass: result.benchmark.rawRoute.regionClass,
      tollDistance: 0,
    }));

    const snapshotName =
      formData.get("snapshotName")?.toString() || "Default Snapshot Name";
    const snapshotDescription = formData.get("snapshotDescription")?.toString();

    const snapshot = await prisma.snapshot.create({
      data: {
        name: snapshotName,
        description: snapshotDescription,
        routeResults: {
          create: results.map((result) => ({
            routinEngineResultId: result.routinEngineResultId,
            runId: result.runId,
            benchmarkId: result.benchmarkId,
            rawRouteId: result.rawRouteId,
            referenceDistance: result.referenceDistance,
            referenceDuration: result.referenceDuration,
            meanReferenceSpeed: result.meanReferenceSpeed,
            referenceTollDistance: result.referenceTollDistance,
            referenceGeometries: result.referenceGeometries,
            name: result.name,
            distance: result.distance,
            duration: result.duration,
            meanSpeed: result.meanSpeed,
            tollDistance: result.tollDistance,
            rtt: result.rtt,
            geometries: result.geometries,
            distanceClass: result.distanceClass,
            regionClass: result.regionClass,
          })),
        },
      },
    });
    return redirect(`/analysestats?snapshotId=${snapshot.id}`);
  } else {
    return redirect(`/`);
  }
}

export default function SaveSnapshots() {
  const navigation = useNavigation();
  return (
    <>
      <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
        <div className="container mx-auto space-y-12">
          <div className="p-5 max-w-lg mx-auto my-10 bg-white rounded-xl shadow-md">
            {navigation.state === "submitting" ? (
              <Spinner />
            ) : (
              <div className="p-4">
                <h1 className="text-5xl font-bold text-blue-600 mb-4 ">
                  Save Snapshot
                </h1>
                <Form method="post" className="space-y-4">
                  <div>
                    <input
                      type="text"
                      name="snapshotName"
                      placeholder="Enter snapshot name"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <textarea
                      name="snapshotDescription"
                      placeholder="Enter snapshot description"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    name="_action"
                    value="saveData"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Snapshot
                  </button>
                </Form>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
