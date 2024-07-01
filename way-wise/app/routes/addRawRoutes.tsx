import fs from "fs";
import path from "path";

import {
  ActionFunction,
  ActionFunctionArgs,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { parse } from "papaparse";

import Spinner from "../components/Spinner";
import { prisma } from "../db.server";

interface FileObject {
  filepath: string;
}

interface Record {
  latitude_from: string;
  longitude_from: string;
  latitude_to: string;
  longitude_to: string;
}

async function getCountryFromCoordinates(
  lat: number,
  lon: number,
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching country: ${response.statusText}`);
    }
    const data = await response.json();
    return data.address.country;
  } catch (error) {
    console.error("Failed to fetch country:", error);
    return null;
  }
}

async function processCoordinatesWithDelay(
  lat: number,
  lon: number,
): Promise<string | null> {
  return await getCountryFromCoordinates(lat, lon);
}

async function classifyRouteRegion(
  startLat: number,
  startLon: number,
  destinationLat: number,
  destinationLon: number,
): Promise<string> {
  try {
    const startCountry = await processCoordinatesWithDelay(startLat, startLon);
    const destinationCountry = await processCoordinatesWithDelay(
      destinationLat,
      destinationLon,
    );
    return startCountry === destinationCountry ? "national" : "international";
  } catch (error) {
    console.error("Error classifying the route region:", error);
    return "unknown";
  }
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function classifyDistance(distance: number): string {
  if (distance < 10) {
    return "very-short";
  } else if (distance >= 10 && distance < 100) {
    return "short";
  } else if (distance >= 100 && distance <= 500) {
    return "middle";
  } else if (distance > 500 && distance <= 1000) {
    return "long";
  } else if (distance > 1000) {
    return "very-long";
  } else {
    return "undefined";
  }
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });

    const uploadHandler = unstable_composeUploadHandlers(
      unstable_createFileUploadHandler({
        maxPartSize: 5_000_000,
        directory: uploadsDir,
        file: ({ filename }) => path.join(uploadsDir, filename),
      }),
      unstable_createMemoryUploadHandler(),
    );

    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler,
    );
    const file = formData.get("file") as unknown as FileObject;

    if (!file || typeof file.filepath !== "string") {
      console.error("File upload failed, no valid file received");
      return new Response("File upload failed, no valid file received", {
        status: 400,
      });
    }

    const filePath = file.filepath;
    const fileContents = fs.readFileSync(filePath, "utf8");

    let records: Record[] = [];
    parse<Record>(fileContents, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        records = results.data;
      },
    });

    for (const record of records) {
      const startLat = parseFloat(record.latitude_from);
      const startLon = parseFloat(record.longitude_from);
      const destinationLat = parseFloat(record.latitude_to);
      const destinationLon = parseFloat(record.longitude_to);

      if (
        !isValidCoordinate(startLat, startLon) ||
        !isValidCoordinate(destinationLat, destinationLon)
      ) {
        console.log("Invalid coordinates in CSV file:", record);
        continue;
      }

      const distance = haversineDistance(
        startLat,
        startLon,
        destinationLat,
        destinationLon,
      );
      const distanceClass = classifyDistance(distance);
      const regionClass = await classifyRouteRegion(
        startLat,
        startLon,
        destinationLat,
        destinationLon,
      );

      const validatedRawRoutes = {
        startLat,
        startLon,
        destinationLat,
        destinationLon,
        distance,
        distanceClass,
        regionClass,
      };

      try {
        await prisma.rawRoute.create({ data: validatedRawRoutes });

        console.log("Processed route:", validatedRawRoutes);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = error as any;
        if (
          e.code === "P2002" &&
          e.meta?.target?.includes(
            "startLat_startLon_destinationLat_destinationLon",
          )
        ) {
          console.log("Duplicate coordinates in CSV file:", record);
        } else {
          console.error("Error creating route in the database:", error);
        }
      }
    }
    fs.unlinkSync(filePath);
    return new Response("Processing complete", { status: 200 });
  } catch (error) {
    console.error("Error processing CSV file:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

export default function UploadRawRoutes() {
  const actionData = useActionData();
  const transition = useNavigation();
  const isSubmitting = transition.state === "submitting";

  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <div className="p-5 max-w-lg mx-auto my-10 bg-white rounded-xl shadow-md">
          <h1 className="text-5xl font-bold text-blue-600">Upload CSV File</h1>
          <Form method="post" encType="multipart/form-data">
            <div>
              <label
                htmlFor="file"
                className="block mt-4 text-sm font-medium text-blue-600"
              >
                Select file:
              </label>
              <input
                type="file"
                id="file"
                name="file"
                accept=".csv"
                required
                className="mt-1 block w-full border-gray-300 shadow-sm focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className={`inline-block mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-500 transition-transform transform hover:-translate-y-1 ${
                isSubmitting ? "button-disabled" : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
            {isSubmitting ? <Spinner /> : null}
            {actionData ? (
              <button
                type="button"
                className="inline-block m-4 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-500 transition-transform transform hover:-translate-y-1"
                onClick={() => (window.location.href = "/addReferences")}
              >
                {isSubmitting ? "adding..." : "add References"}
              </button>
            ) : null}
          </Form>
        </div>
      </div>
    </main>
  );
}
