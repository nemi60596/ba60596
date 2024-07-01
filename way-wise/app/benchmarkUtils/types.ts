//---OSRM, GraphHopper, Valhalla API Response Types---
//---OSRM---

export interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  waypoints: OSRMWaypoint[];
}

export interface OSRMRoute {
  geometry: string;
  legs: OSRMLeg[];
  weight_name: string;
  weight: number;
  duration: number;
  distance: number;
}

export interface OSRMLeg {
  steps: OSRMSteps[];
  summary: string;
  weight: number;
  duration: number;
  distance: number;
}

export interface OSRMSteps {
  instruction: string;
  distance: number;
  name?: string;
  geometry: string;
}

export interface OSRMWaypoint {
  hint: string;
  distance: number;
  name: string;
  location: [number, number];
}

//---GraphHopper---

export interface GraphHopperResponse {
  paths: GraphHopperPath[];
  info: {
    copyright: {
      text: string;
      url: string;
    }[];
    took: number;
  };
}

export interface GraphHopperPath {
  distance: number;
  time: number;
  points: {
    coordinates: number[][];
    type: string;
  };
  points_encoded: boolean;
  bbox: number[];
  instructions?: GraphHopperInstruction[];
  legs?: GraphHopperDetails[];
  details?: GraphHopperDetails;
  ascend?: number;
  descend?: number;
  snapped_waypoints?: {
    coordinates: number[][];
    type: string;
  };
}
export interface GraphHopperDetails {
  country?: [number, number, string][];
  toll?: [number, number, string][];
}
export interface GraphHopperInstruction {
  distance: number;
  heading: number;
  sign: number;
  interval: number[];
  text: string;
  time: number;
  street_name: string;
}

//---Valhalla---

export interface ValhallaResponse {
  trip: {
    locations: Location[];
    legs: Leg[];
    summary: Summary;
    status_message: string;
    status: number;
    units: string;
    language: string;
  };
}

export interface Location {
  type: string;
  lat: number;
  lon: number;
  original_index: number;
}

export interface Leg {
  maneuvers: Maneuver[];
  summary: Summary;
  shape: string;
}

export interface Maneuver {
  type: number;
  instruction: string;
  verbal_succinct_transition_instruction: string;
  verbal_pre_transition_instruction: string;
  verbal_post_transition_instruction: string;
  street_names?: string[];
  time: number;
  length: number;
  cost: number;
  begin_shape_index: number;
  end_shape_index: number;
  verbal_multi_cue: boolean;
  travel_mode: string;
  travel_type: string;
  highway?: boolean;
  toll?: boolean;
  sign?: Sign;
}

export interface Summary {
  has_time_restrictions: boolean;
  has_toll: boolean;
  has_highway: boolean;
  has_ferry: boolean;
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  time: number;
  length: number;
  cost: number;
}

export interface Sign {
  exit_branch_elements?: ExitBranchElement[];
  exit_toward_elements?: ExitTowardElement[];
  exit_number_elements?: ExitNumberElement[];
  exit_name_elements?: ExitNameElement[];
}

export interface ExitBranchElement {
  text: string;
  consecutive_count?: number;
}

export interface ExitTowardElement {
  text: string;
  consecutive_count?: number;
}

export interface ExitNumberElement {
  text: string;
}

export interface ExitNameElement {
  text: string;
}

//---MapMAtching---KEEP

export interface RouteResponse {
  trip: {
    legs: [
      {
        shape: string;
      },
    ];
  };
}

export interface ValhallaMapMatchRequest {
  shape: { lat: number; lon: number }[];
  costing: string;
  shape_match: string;
  filters: {
    attributes: string[];
    action: string;
  };
}

export interface MapMatchResult {
  admins: {
    country_code: string;
    country_text: string;
    state_code: string;
    state_text: string;
  }[];
  edges: {
    length: number;
    toll: boolean;
    admin: {
      country_code: string;
    };
    end_node: {
      admin_index: number;
    };
  }[];
}

//---Reference Data---
export interface TransportChainItem {
  from: {
    lon: number;
    lat: number;
    type: string;
    uuid: string;
  };
  to: {
    lon: number;
    lat: number;
    type: string;
    uuid: string;
  };
  loadingState: string;
  unitAvailable: boolean;
  modeOfTransport: string;
  distance?: {
    value: number;
    unit: string;
  };
  distancesByCountry?: Record<string, { value: number; unit: string }>;
  tollDistance?: {
    value: number;
    unit: string;
  };
  duration?: {
    value: number;
    unit: string;
  };
  geometries?: string[];
  partOfRoundtrip?: boolean;
  co2?: {
    value: number;
    unit: string;
  };
}

export interface TransportRequestBody {
  transportChain: TransportChainItem[];
}

export interface TransportResponse {
  transportChain: TransportChainItem[];
}

//---Helpers---

export interface RoutingEngineResults {
  name: string;
  distance: number;
  distanceByCountry?: Record<string, { value: number; unit: string }>;
  calculatedDistance?: number;
  tollDistanceByCountry?: Record<string, { value: number; unit: string }>;
  calculatedTollDistance?: number;
  time: number;
  rtt: number;
  elevation?: number;
  geometry: string;
  rawResponse: OSRMResponse | GraphHopperResponse | ValhallaResponse | unknown;
  options?: string;
}
