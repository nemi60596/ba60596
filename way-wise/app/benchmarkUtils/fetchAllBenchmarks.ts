import {
  GraphHopperResponse,
  OSRMResponse,
  RoutingEngineResults,
  ValhallaResponse,
} from "./types";
interface RequestConfig<T extends RoutingApiResponse> {
  url: string;
  parseResponse: (response: T, rtt: number) => RoutingEngineResults;
  options?: RequestInit | undefined;
}
function formatTime(seconds: number): number {
  const totalMinutes = Math.floor(seconds / 60);
  return totalMinutes;
}

async function fetchWithTiming(url: string | URL, options = {}) {
  try {
    const startTime = performance.now();
    const response = await fetch(url, options);
    const endTime = performance.now();
    const rtt = endTime - startTime;
    return { response: await response.json(), rtt, error: null };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { response: null, rtt: 0, error: error.message };
  }
}
type RoutingApiResponse = OSRMResponse | GraphHopperResponse | ValhallaResponse;

export function createRequestConfigs(
  startLat: number,
  startLon: number,
  destinationLat: number,
  destinationLon: number,
): (
  | RequestConfig<OSRMResponse>
  | RequestConfig<GraphHopperResponse>
  | RequestConfig<ValhallaResponse>
)[] {
  {
    const osrmUrl = process.env.OSRM_URL || "http://localhost:5000";
    const graphHopperUrl =
      process.env.GRAPH_HOPPER_URL || "http://localhost:8989";
    const valhallaUrl = process.env.VALHALLA_URL || "http://localhost:8002";

    return [
      {
        url: `${osrmUrl}/route/v1/driving/${startLon},${startLat};${destinationLon},${destinationLat}?steps=true`,
        parseResponse: (
          response: OSRMResponse,
          rtt: number,
        ): RoutingEngineResults => {
          const legGeometries = JSON.stringify(
            response.routes[0].legs.flatMap((leg) =>
              leg.steps.map((step) => step.geometry),
            ),
          );
          return {
            name: "OSRM",
            distance: parseFloat(
              (response.routes[0].distance / 1000).toFixed(2),
            ),
            time: formatTime(response.routes[0].duration),
            rtt,
            geometry: legGeometries,
            rawResponse: response,
          };
        },
      },
      {
        url: `${graphHopperUrl}/route?point=${startLat},${startLon}&point=${destinationLat},${destinationLon}&profile=max_truck&details=country&details=toll&`,
        parseResponse: (
          response: GraphHopperResponse,
          rtt: number,
        ): RoutingEngineResults => {
          return {
            name: "GraphHopper",
            distance: parseFloat(
              (response.paths[0].distance / 1000).toFixed(2),
            ),
            time: formatTime(response.paths[0].time / 1000),
            rtt,
            geometry: JSON.stringify(response.paths[0].points),
            rawResponse: response,
          };
        },
      },
      // HGV customized Post Request
      // {
      //   url: `${graphHopperUrl}/route`,
      //   options: {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       points: [
      //         [startLon, startLat],
      //         [destinationLon, destinationLat],
      //       ],
      //       profile: "custom_truck",
      //       "ch.disable": true,

      //       custom_model: {
      //         priority: [
      //           { if: "road_access == PRIVATE", multiply_by: 0 },
      //           {
      //             if: "car_access == false || hgv == NO || max_width < 2.55 || max_height < 4.0 || max_weight < 40000 || max_length < 18.75",
      //             multiply_by: 0,
      //           },
      //           { if: "road_access == CUSTOMERS", multiply_by: 0 },
      //           { if: "road_access == DELIVERY", multiply_by: 0 },
      //           { if: "road_access == DESTINATION", multiply_by: 0 },
      //         ],
      //         speed: [
      //           { if: "road_class == MOTORWAY", limit_to: 75 },
      //           { if: "road_class == TRUNK", limit_to: 65 },
      //           { if: "road_class == PRIMARY", limit_to: 50 },
      //           { if: "road_class == SECONDARY", limit_to: 30 },
      //           { if: "road_class == TERTIARY", limit_to: 15 },
      //           { if: "road_class == UNCLASSIFIED", limit_to: 10 },
      //           { if: "road_class == RESIDENTIAL", limit_to: 8 },
      //           { if: "road_class == LIVING_STREET", limit_to: 3 },
      //           { if: "road_class == SERVICE", limit_to: 3 },
      //           { if: "surface == DIRT", limit_to: 20 },
      //           { if: "surface == PAVED", limit_to: 65 },
      //           { if: "surface == COBBLESTONE", limit_to: 20 },
      //           { if: "surface == ASPHALT", limit_to: 65 },
      //           { if: "surface == SAND", limit_to: 20 },
      //           { if: "surface == CONCRETE", limit_to: 75 },
      //           { if: "surface == PAVING_STONES", limit_to: 40 },
      //           { if: "surface == COMPACTED", limit_to: 50 },
      //           { if: "surface == GROUND", limit_to: 30 },
      //           { if: "surface == GRAVEL", limit_to: 30 },
      //           { if: "surface == PAVED", limit_to: 60 },
      //           { if: "surface == SAND", limit_to: 30 },
      //           { if: "surface == UNPAVED", limit_to: 30 },
      //           { if: "surface == WOOD", limit_to: 30 },
      //         ],
      //       },
      //       details: ["country", "toll"],
      //     }),
      //   },
      //   parseResponse: (
      //     response: GraphHopperResponse,
      //     rtt: number,
      //   ): RoutingEngineResults => {
      //     return {
      //       name: "GraphHopper",
      //       distance: parseFloat(
      //         (response.paths[0].distance / 1000).toFixed(2),
      //       ),
      //       time: formatTime(response.paths[0].time / 1000),
      //       rtt,
      //       geometry: JSON.stringify(response.paths[0].points),
      //       rawResponse: response,
      //     };
      //   },
      // },
      {
        url: `${valhallaUrl}/route`,
        options: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locations: [
              { lat: startLat, lon: startLon },
              { lat: destinationLat, lon: destinationLon },
            ],
            costing: "truck",
            costing_options: {
              truck: {
                height: 4.0,
                width: 2.55,
                length: 18.75,
                weight: 40.0,
                top_speed: 70.0,
                //hazmat: false, // Hazardous materials indicator
                //toll_booth_cost: 120, // Cost for toll booths in seconds
                // ferry_cost: 300, // Cost for ferries in seconds
                // use_tolls: 0.7, // Preference for toll roads (0.0 to 1.0)
                // use_ferry: 0.1, // Preference for ferries (0.0 to 1.0)
                //use_highways: 1.0, // Preference for primary roads (0.0 to 1.0)
              },
            },
            directions_options: {
              units: "kilometers",
              language: "en",
            },
            max_distance: 3000000,
          }),
        },
        parseResponse: (
          response: ValhallaResponse,
          rtt: number,
        ): RoutingEngineResults => {
          const geometry = response.trip.legs.map((leg) => leg.shape).join(";");
          return {
            name: "Valhalla",
            distance: parseFloat(response.trip.summary.length.toFixed(2)),
            time: formatTime(response.trip.summary.time),
            rtt,
            geometry,
            rawResponse: response,
          };
        },
      },
    ];
  }
}

function isOSRMResponse(response: unknown): response is OSRMResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "routes" in response &&
    Array.isArray((response as OSRMResponse).routes)
  );
}

function isGraphHopperResponse(
  response: unknown,
): response is GraphHopperResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "paths" in response &&
    Array.isArray((response as GraphHopperResponse).paths)
  );
}

function isValhallaResponse(response: unknown): response is ValhallaResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "trip" in response &&
    typeof (response as ValhallaResponse).trip === "object" &&
    "legs" in (response as ValhallaResponse).trip &&
    Array.isArray((response as ValhallaResponse).trip.legs)
  );
}
async function processRequest<T extends RoutingApiResponse>({
  url,
  parseResponse,
  options = {},
}: RequestConfig<T>) {
  const { response, rtt, error } = await fetchWithTiming(url, options);
  if (error || !response) {
    return {
      name: "",
      distance: 0,
      time: 0,
      rtt: 0,
      geometry: "",
      status: "failure",
      error: error || "Unknown error",
      rawResponse: null,
    };
  }
  if (
    (isOSRMResponse(response) &&
      (parseResponse as unknown) instanceof Function) ||
    (isGraphHopperResponse(response) &&
      (parseResponse as unknown) instanceof Function) ||
    (isValhallaResponse(response) &&
      (parseResponse as unknown) instanceof Function)
  ) {
    return parseResponse(response as T, rtt); // Safe to cast here
  }
  console.log("Invalid response type", response);
  return {
    name: "",
    distance: 0,
    time: 0,
    rtt: 0,
    geometry: "",
    status: "failure",
    error: error || "Unknown error",
    rawResponse: null,
  };
}
export default async function fetchAllBenchmarks(
  startLat: number,
  startLon: number,
  destinationLat: number,
  destinationLon: number,
): Promise<RoutingEngineResults[]> {
  const requests = createRequestConfigs(
    startLat,
    startLon,
    destinationLat,
    destinationLon,
  );
  const results = await Promise.all(
    requests.map((req) =>
      processRequest(req as RequestConfig<RoutingApiResponse>),
    ),
  );

  if (results.length === 0) {
    throw new Error("No results found");
  }

  return results;
}
