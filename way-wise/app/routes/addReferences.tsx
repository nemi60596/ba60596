import { json, LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";

import Spinner from "../components/Spinner";
import { prisma } from "../db.server";

const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

export async function referenceRequest(
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number,
) {
  const requestBody = {
    transportChain: [
      {
        from: { lon: fromLon, lat: fromLat, type: "ADDRESS", uuid: "" },
        to: { lon: toLon, lat: toLat, type: "ADDRESS", uuid: "" },
        loadingState: "EMPTY",
        unitAvailable: false,
        modeOfTransport: "ROAD",
      },
    ],
  };

  const username = process.env.IRIS_USERNAME || "admin@example.com";
  const password = process.env.IRIS_PASSWORD || "admin";
  const irisUrl = process.env.IRIS_BASE_URL || "http://localhost:8082";
  const base64Credentials = btoa(`${username}:${password}`);

  const response = await fetch(`${irisUrl}/api/transport`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${base64Credentials}`,
    },
    body: JSON.stringify(requestBody),
  });
  console.log("Received response from IRIS API with status:", response.status);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json();

  return responseData;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);

  const startLat = parseFloat(url.searchParams.get("startLat") || "0");
  const startLon = parseFloat(url.searchParams.get("startLon") || "0");
  const destinationLat = parseFloat(
    url.searchParams.get("destinationLat") || "0",
  );
  const destinationLon = parseFloat(
    url.searchParams.get("destinationLon") || "0",
  );

  const references = [];

  const rawRoutesToFix = await prisma.rawRoute.findMany({
    where: {
      reference: { NOT: undefined },
      referenceId: null,
    },
    include: { reference: true },
  });

  for (const route of rawRoutesToFix) {
    if (route.reference) {
      const duplicateRoutes = await prisma.rawRoute.findMany({
        where: {
          referenceId: route.reference.id,
          id: { not: route.id },
        },
      });

      let isDuplicate = false;

      for (const dupRoute of duplicateRoutes) {
        if (
          parseFloat(dupRoute.startLat.toFixed(4)) ===
            parseFloat(route.startLat.toFixed(4)) &&
          parseFloat(dupRoute.startLon.toFixed(4)) ===
            parseFloat(route.startLon.toFixed(4)) &&
          parseFloat(dupRoute.destinationLat.toFixed(4)) ===
            parseFloat(route.destinationLat.toFixed(4)) &&
          parseFloat(dupRoute.destinationLon.toFixed(4)) ===
            parseFloat(route.destinationLon.toFixed(4))
        ) {
          isDuplicate = true;
          console.log(
            `Duplicate rawRoute found: ID ${route.id} has similar coordinates as ID ${dupRoute.id}`,
          );
          break;
        }
      }

      if (isDuplicate) {
        try {
          const transportResponse = await referenceRequest(
            route.startLon,
            route.startLat,
            route.destinationLon,
            route.destinationLat,
          );

          const data = transportResponse.transportChain[0];
          const validatedReference = {
            loadingState: data.loadingState,
            unitAvailable: data.unitAvailable,
            modeOfTransport: data.modeOfTransport,
            distanceValue: data.distance.value,
            distanceUnit: data.distance.unit,
            tollDistanceValue: data.tollDistance.value,
            tollDistanceUnit: data.tollDistance.unit,
            durationValue: data.duration.value,
            durationUnit: data.duration.unit,
            geometries: JSON.stringify(data.geometries),
            partOfRoundtrip: data.partOfRoundtrip,
            co2Value: data.co2.value,
            co2Unit: data.co2.unit,
          };

          try {
            const newReference = await prisma.reference.create({
              data: {
                ...validatedReference,
                rawRoutes: { connect: { id: route.id } },
              },
            });
            await prisma.rawRoute.update({
              where: { id: route.id },
              data: { referenceId: newReference.id },
            });
            console.log(
              `Created new reference for rawRoute ID ${route.id} due to coordinate difference at 5th decimal place`,
            );
          } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = error as any;
            if (e.code === "P2002" && e.meta.target.includes("geometries")) {
              console.error(`Unique constraint violation for geometries: }`);
            } else {
              throw error;
            }
          }
        } catch (error) {
          console.error(
            `Error creating new reference for rawRoute ID ${route.id}`,
          );
        }
      } else {
        // Update the rawRoute with the existing referenceId
        try {
          await prisma.rawRoute.update({
            where: { id: route.id },
            data: { referenceId: route.reference.id },
          });
          console.log(
            `Fixed rawRoute ID ${route.id} to add missing referenceId ${route.reference.id}`,
          );
        } catch (error) {
          console.error(
            `Error updating rawRoute ID ${route.id} with referenceId ${route.reference.id}: ${error}`,
          );
        }
      }
    }
  }

  if (!startLat || !startLon || !destinationLat || !destinationLon) {
    const rawRoutes = await prisma.rawRoute.findMany({
      where: { OR: [{ referenceId: null }, { reference: null }] },
    });
    console.log(`Found ${rawRoutes.length} raw routes without references.`);

    for (const route of rawRoutes) {
      try {
        const transportResponse = await referenceRequest(
          route.startLon,
          route.startLat,
          route.destinationLon,
          route.destinationLat,
        );

        const data = transportResponse.transportChain[0];
        const geometriesString = JSON.stringify(data.geometries);
        const existingReference = await prisma.reference.findUnique({
          where: { geometries: geometriesString },
        });

        if (existingReference) {
          const updatedReference = await prisma.reference.update({
            where: { id: existingReference.id },
            data: {
              rawRoutes: { connect: { id: route.id } },
            },
            include: { rawRoutes: true },
          });
          await prisma.rawRoute.update({
            where: { id: route.id },
            data: { referenceId: existingReference.id },
          });
          references.push({
            reference: updatedReference,
            message: "Existing reference updated.",
          });
        } else {
          try {
            const validatedReference = {
              loadingState: data.loadingState,
              unitAvailable: data.unitAvailable,
              modeOfTransport: data.modeOfTransport,
              distanceValue: data.distance.value,
              distanceUnit: data.distance.unit,
              tollDistanceValue: data.tollDistance.value,
              tollDistanceUnit: data.tollDistance.unit,
              durationValue: data.duration.value,
              durationUnit: data.duration.unit,
              geometries: JSON.stringify(data.geometries),
              partOfRoundtrip: data.partOfRoundtrip,
              co2Value: data.co2.value,
              co2Unit: data.co2.unit,
            };

            const newReference = await prisma.reference.create({
              data: {
                ...validatedReference,
                rawRoutes: { connect: { id: route.id } },
              },
            });
            await prisma.rawRoute.update({
              where: { id: route.id },
              data: { referenceId: newReference.id },
            });
            references.push(newReference);
          } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = error as any;
            if (e.code === "P2002" && e.meta.target.includes("geometries")) {
              console.error(
                `Unique constraint violation for geometries: ${geometriesString}`,
              );
            } else {
              console.error(
                `Error creating new reference for raw route ID ${route.id}: ${error}`,
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to process raw route ID:", route.id);
      }
    }

    return json({
      references,
      message: "References updated for RawRoutes without references.",
    });
  }

  //[WIP]: This code fetches a single rawRoute record
  //from a database based on provided coordinates and updates or
  //creates associated reference data if it is either outdated or
  //missing, connecting it to the rawRoute; it handles errors and
  //returns appropriate JSON responses. It will only update the Reference
  //if it is older than one year.

  try {
    const rawRoute = await prisma.rawRoute.findFirst({
      where: { startLat, startLon, destinationLat, destinationLon },
      include: { reference: true },
    });

    if (!rawRoute) {
      return json(
        { message: "No entry for the provided RawRoute coordinates." },
        { status: 404 },
      );
    }

    if (rawRoute.reference) {
      const oneYearAgo = new Date(Date.now() - ONE_YEAR_IN_MS);
      if (new Date(rawRoute.reference.updatedAt) < oneYearAgo) {
        const transportResponse = await referenceRequest(
          startLon,
          startLat,
          destinationLon,
          destinationLat,
        );
        const data = transportResponse.transportChain[0];

        const validatedReference = {
          loadingState: data.loadingState,
          unitAvailable: data.unitAvailable,
          modeOfTransport: data.modeOfTransport,
          distanceValue: data.distance.value,
          distanceUnit: data.distance.unit,
          tollDistanceValue: data.tollDistance.value,
          tollDistanceUnit: data.tollDistance.unit,
          durationValue: data.duration.value,
          durationUnit: data.duration.unit,
          geometries: JSON.stringify(data.geometries),
          partOfRoundtrip: data.partOfRoundtrip,
          co2Value: data.co2.value,
          co2Unit: data.co2.unit,
        };

        const updatedReference = await prisma.reference.update({
          where: { id: rawRoute.reference.id },
          data: {
            ...validatedReference,
            updatedAt: new Date(),
          },
        });

        return json({
          reference: updatedReference,
          message: "Reference updated due to being older than one year.",
        });
      }
      return json({ reference: rawRoute.reference });
    } else {
      const transportResponse = await referenceRequest(
        startLon,
        startLat,
        destinationLon,
        destinationLat,
      );
      const data = transportResponse.transportChain[0];
      const geometriesString = JSON.stringify(data.geometries);

      const existingReference = await prisma.reference.findFirst({
        where: { geometries: geometriesString },
      });

      if (existingReference) {
        if (!rawRoute.referenceId) {
          const updatedReference = await prisma.reference.update({
            where: { id: existingReference.id },
            data: { rawRoutes: { connect: { id: rawRoute.id } } },
            include: { rawRoutes: true },
          });
          await prisma.rawRoute.update({
            where: { id: rawRoute.id },
            data: { referenceId: existingReference.id },
          });
          return json({
            reference: updatedReference,
            message: "Existing reference updated and connected to RawRoute.",
          });
        }
        return json({
          reference: existingReference,
          message: "RawRoute already connected to a reference.",
        });
      } else {
        try {
          const validatedReference = {
            loadingState: data.loadingState,
            unitAvailable: data.unitAvailable,
            modeOfTransport: data.modeOfTransport,
            distanceValue: data.distance.value,
            distanceUnit: data.distance.unit,
            tollDistanceValue: data.tollDistance.value,
            tollDistanceUnit: data.tollDistance.unit,
            durationValue: data.duration.value,
            durationUnit: data.duration.unit,
            geometries: JSON.stringify(data.geometries),
            partOfRoundtrip: data.partOfRoundtrip,
            co2Value: data.co2.value,
            co2Unit: data.co2.unit,
          };

          const newReference = await prisma.reference.create({
            data: {
              ...validatedReference,
              rawRoutes: { connect: { id: rawRoute.id } },
            },
          });
          await prisma.rawRoute.update({
            where: { id: rawRoute.id },
            data: { referenceId: newReference.id },
          });
          return json({ reference: newReference });
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = error as any;
          if (e.code === "P2002" && e.meta.target.includes("geometries")) {
            console.error(
              `Unique constraint violation for geometries: ${geometriesString}`,
            );
          } else {
            console.error(
              `Error creating new reference for raw route ID ${rawRoute.id}`,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error accessing the database or fetching data:");
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export default function AddReferences() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const data = useLoaderData();

  useEffect(() => {
    if (data) {
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (navigation.state === "submitting") {
      setIsLoading(true);
    } else if (navigation.state === "idle" && !isLoading) {
      setIsLoading(false);
    }
  }, [navigation.state, isLoading]);
  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isLoading ? <Spinner /> : null}

          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            Transport Route Reference
          </h1>
          <Form method="post" action="/createRun" className="mb-4">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Create Run
            </button>
          </Form>
          {data ? (
            <div className="bg-blue-100 border border-blue-200 p-4 rounded-md">
              <h2 className="text-lg font-semibold">Results:</h2>
              <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
