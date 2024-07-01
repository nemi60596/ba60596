import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export function MapLegend({
  colorMap,
}: {
  colorMap: Record<string, { color: string }>;
}) {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      const labels = ["<strong>Routes</strong>"];
      for (const [key, { color }] of Object.entries(colorMap)) {
        // Make sure the <i> element has a set size and displays as an inline-block
        labels.push(
          `<i style="background:${color}; width:18px; height:18px; border-radius: 50%; display: inline-block; margin-right: 5px;"></i> ${key}`,
        );
      }
      div.innerHTML = labels.join("<br>");
      return div;
    };

    map.addControl(legend);

    return () => {
      map.removeControl(legend);
    };
  }, [map, colorMap]);

  return null;
}
