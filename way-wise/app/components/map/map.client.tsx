import type { LatLngExpression, LatLngTuple } from "leaflet";
import { LatLngBounds } from "leaflet";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import { MapLegend } from "./legend";

interface MapProps {
  height: string;
  polylines: Record<string, LatLngExpression[] | LatLngExpression[][]>;
  colorMap: Record<string, { color: string; opacity: number }>;
  startCoords?: LatLngExpression[];
  destCoords?: LatLngExpression[];
}

function SetBounds({ bounds }: { bounds: LatLngExpression[] }) {
  const map = useMap();

  if (bounds.length > 0) {
    const latLngBounds = new LatLngBounds(
      bounds.map((coord) =>
        Array.isArray(coord) ? coord : ([coord.lat, coord.lng] as LatLngTuple),
      ),
    );
    map.fitBounds(latLngBounds);
  }

  return null;
}

export function Map({
  height,
  polylines,
  colorMap,
  startCoords,
  destCoords,
}: MapProps) {
  let initialPosition: LatLngExpression = [48.505, -0.09];
  let bounds: LatLngExpression[] = [];

  if (startCoords && startCoords.length > 0) {
    bounds = bounds.concat(startCoords);
  }

  if (destCoords && destCoords.length > 0) {
    bounds = bounds.concat(destCoords);
  }

  if (bounds.length > 0) {
    initialPosition = bounds[0];
  }
  if (polylines["Reference"] && polylines["Reference"].length > 0) {
    const firstSegment = polylines["Reference"][0];
    if (Array.isArray(firstSegment) && firstSegment.length > 0) {
      initialPosition = firstSegment[0] as LatLngExpression;
    }
  }

  return (
    <div style={{ height }}>
      <MapContainer
        style={{ height: "100%", width: "100%" }}
        center={initialPosition}
        zoom={13}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.entries(polylines).map(([name, polylineData]) => {
          const positions: LatLngExpression[][] = Array.isArray(polylineData[0])
            ? (polylineData as LatLngExpression[][])
            : [polylineData as LatLngExpression[]];

          return positions.map((segment, index) => (
            <Polyline
              key={`${name}-${index}`}
              pathOptions={{
                color: colorMap[name].color,
                opacity: colorMap[name].opacity,
              }}
              positions={segment}
            />
          ));
        })}
        {startCoords?.map((coord, index) => (
          <Marker key={`start-${index}`} position={coord}>
            <Popup>Start {index + 1}</Popup>
          </Marker>
        ))}
        {destCoords?.map((coord, index) => (
          <Marker key={`dest-${index}`} position={coord}>
            <Popup>Destination {index + 1}</Popup>
          </Marker>
        ))}
        {bounds.length > 0 ? <SetBounds bounds={bounds} /> : null}
        {colorMap ? <MapLegend colorMap={colorMap} /> : null}{" "}
      </MapContainer>
    </div>
  );
}
