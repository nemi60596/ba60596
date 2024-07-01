import { TransportRequestBody, TransportResponse } from "./types";

export async function referenceRequest(
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number,
): Promise<TransportResponse> {
  const requestBody: TransportRequestBody = {
    transportChain: [
      {
        from: {
          lon: fromLon,
          lat: fromLat,
          type: "ADDRESS",
          uuid: "",
        },
        to: {
          lon: toLon,
          lat: toLat,
          type: "ADDRESS",
          uuid: "",
        },
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

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as TransportResponse;
}
