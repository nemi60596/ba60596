#!/bin/bash

# Define the URL for the routing request
routing_url="http://localhost:5000/route/v1/driving/7.661593,47.614764;7.588576,47.559599?steps=true&geometries=geojson"

# Get the routing JSON, extract the coordinates using jq to output them in a flat array
coordinates=$(curl -s "$routing_url" | jq -c '.routes[0].legs[].steps[].geometry.coordinates[] | @csv' | tr -d '"' | paste -sd ";" -)

# Check if coordinates were extracted
if [ -z "$coordinates" ]; then
    echo "Failed to obtain coordinates from the route"
    exit 1
fi

echo "Extracted Coordinates: $coordinates"

# Define the URL for the map matching service with direct coordinates
matching_url="http://localhost:5000/match/v1/driving/$coordinates?steps=true&geometries=geojson"

# Perform the map matching request and print the output
curl -s "$matching_url" | jq .

echo "Map matching complete."