#!/bin/bash

# Valhalla server URL
VALHALLA_URL="http://localhost:8002"

# Start and end points for Lörrach to Basel
START_LAT="47.6145"
START_LON="7.6615"
END_LAT="47.5596"
END_LON="7.5886"

# Formulate JSON data for route request using jq to ensure correct formatting
ROUTE_REQUEST_JSON=$(jq -n --arg lat1 "$START_LAT" --arg lon1 "$START_LON" --arg lat2 "$END_LAT" --arg lon2 "$END_LON" \
'{
  locations: [
    {lat: ($lat1 | tonumber), lon: ($lon1 | tonumber)},
    {lat: ($lat2 | tonumber), lon: ($lon2 | tonumber)}
  ],
  costing: "auto"
}')

# Make a routing request from Lörrach to Basel
ROUTE_JSON=$(curl -s -X POST "$VALHALLA_URL/route" --header 'Content-Type: application/json' --data "$ROUTE_REQUEST_JSON")

# Extract the encoded polyline and prepare it for the trace attributes request
ENC_POLYLINE=$(echo "$ROUTE_JSON" | jq -r '.trip.legs[0].shape' 2>/dev/null)
if [[ -n "$ENC_POLYLINE" ]]; then
  # Formulate JSON data for trace attributes request
  TRACE_REQUEST_JSON=$(jq -n --arg polyline "$ENC_POLYLINE" \
  '{
    encoded_polyline: $polyline,
    costing: "auto",
    shape_match: "map_snap",
    filters: {
     "attributes": ["edge.names", "edge.id", "edge.weighted_grade", "edge.speed", "edge.toll", "edge.length", "admin.state_code", "admin.state_text", "admin.country_code", "admin.country_text", "node.admin_index", "matched_point.distance_from_trace_point"],
      action: "include"
    }
  }')

  # Make a trace attributes request with the obtained encoded polyline
  TRACE_ATTRS_JSON=$(curl -s -X POST "$VALHALLA_URL/trace_attributes" --header 'Content-Type: application/json' --data "$TRACE_REQUEST_JSON")

  # Output the trace attributes results
  echo "Trace Attributes Response:"
  echo "$TRACE_ATTRS_JSON" | jq '.' > trace_attrs.json

else
  echo "Failed to get a valid route or extract shape. Please check the input coordinates and Valhalla setup."
fi