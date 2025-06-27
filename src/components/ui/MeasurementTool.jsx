// ສ້າງ MeasurementTool.jsx ໃນ src/components/ui/
import { useEffect } from "react";
import { LineString, Polygon } from "ol/geom";
import { getLength, getArea } from "ol/sphere";

export function useMeasurement(map) {
  const [measurements, setMeasurements] = useState([]);

  const measureFeature = (feature) => {
    const geometry = feature.getGeometry();
    let measurement = "";

    if (geometry instanceof LineString) {
      measurement = `${getLength(geometry).toFixed(2)} ແມັດ`;
    } else if (geometry instanceof Polygon) {
      measurement = `${getArea(geometry).toFixed(2)} ຕລ.ມ.`;
    }

    setMeasurements([...measurements, measurement]);
  };

  return { measurements, measureFeature };
}
