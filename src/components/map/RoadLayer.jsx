import React, { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Stroke, Style } from "ol/style";

const RoadLayer = ({ map, isVisible, selectedProvince }) => {
  const layerRef = useRef(null);
  const sourceRef = useRef(new VectorSource());

  useEffect(() => {
    if (!map) return;

    if (!layerRef.current) {
      const style = new Style({
        stroke: new Stroke({
          color: "#8B4513",
          width: 3,
        }),
      });

      layerRef.current = new VectorLayer({
        source: sourceRef.current,
        style: style,
        properties: { name: "road_layer" },
      });

      map.addLayer(layerRef.current);
      console.log("Road Layer added to map.");
    }

    layerRef.current.setVisible(isVisible);

    sourceRef.current.clear();

    if (isVisible && selectedProvince) {
      console.log(`Loading road data for province: ${selectedProvince}`);
      let dummyRoadsGeoJSON = {
        type: "FeatureCollection",
        features: [],
      };

      // Changed province names to English for consistency with the fix
      if (selectedProvince === "VientianeCapital") {
        dummyRoadsGeoJSON.features.push({
          type: "Feature",
          properties: { province: "VientianeCapital", name: "ຖະໜົນ 1" },
          geometry: {
            type: "LineString",
            coordinates: [
              [102.55, 17.95],
              [102.6, 17.98],
              [102.65, 18.0],
            ],
          },
        });
        dummyRoadsGeoJSON.features.push({
          type: "Feature",
          properties: { province: "VientianeCapital", name: "ຖະໜົນ 2" },
          geometry: {
            type: "LineString",
            coordinates: [
              [102.62, 17.9],
              [102.58, 17.92],
            ],
          },
        });
      } else if (selectedProvince === "LuangPrabang") {
        // Example for another province
        dummyRoadsGeoJSON.features.push({
          type: "Feature",
          properties: { province: "LuangPrabang", name: "ຖະໜົນຫຼວງພະບາງ" },
          geometry: {
            type: "LineString",
            coordinates: [
              [102.1, 19.85],
              [102.15, 19.9],
            ],
          },
        });
      }
      // Add more conditions for other provinces as needed

      sourceRef.current.addFeatures(
        new GeoJSON().readFeatures(dummyRoadsGeoJSON, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        })
      );
    }

    return () => {
      if (map && layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
        sourceRef.current.clear();
        console.log("Road Layer removed from map.");
      }
    };
  }, [map, isVisible, selectedProvince]);

  return null;
};

export default RoadLayer;
