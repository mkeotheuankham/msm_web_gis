import React, { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";

const BuildingLayer = ({ map, isVisible, selectedDistrict }) => {
  // ຮັບ selectedDistrict
  const layerRef = useRef(null);
  const sourceRef = useRef(new VectorSource()); // ໃຊ້ useRef ສໍາລັບ source ເພື່ອບໍ່ໃຫ້ສ້າງໃໝ່ເລື້ອຍໆ

  useEffect(() => {
    if (!map) return;

    if (!layerRef.current) {
      // Initial layer creation
      const style = new Style({
        fill: new Fill({
          color: "rgba(200, 200, 200, 0.6)", // Light gray with some transparency
        }),
        stroke: new Stroke({
          color: "#555", // Darker gray border
          width: 1,
        }),
      });

      layerRef.current = new VectorLayer({
        source: sourceRef.current, // ໃຊ້ sourceRef
        style: style,
        properties: { name: "building_layer" },
      });

      map.addLayer(layerRef.current);
      console.log("Building Layer added to map.");
    }

    // Update layer visibility
    layerRef.current.setVisible(isVisible);

    // Update source based on selectedDistrict
    sourceRef.current.clear(); // Clear existing features

    if (isVisible && selectedDistrict) {
      console.log(`Loading building data for district: ${selectedDistrict}`);
      // Replace this dummy data logic with your actual API call
      // Example: fetch(`/api/buildings?district=${selectedDistrict}`).then(res => res.json()).then(data => {
      //   sourceRef.current.addFeatures(new GeoJSON().readFeatures(data, {
      //     dataProjection: 'EPSG:4326',
      //     featureProjection: 'EPSG:3857'
      //   }));
      // });

      // Dummy GeoJSON data for demonstration
      let dummyBuildingsGeoJSON = {
        type: "FeatureCollection",
        features: [],
      };

      if (selectedDistrict === "ຈັນທະບູລີ") {
        dummyBuildingsGeoJSON.features.push({
          type: "Feature",
          properties: { district: "ຈັນທະບູລີ", name: "ອາຄານ 1" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [102.61, 17.96],
                [102.61, 17.97],
                [102.62, 17.97],
                [102.62, 17.96],
                [102.61, 17.96],
              ],
            ],
          },
        });
      } else if (selectedDistrict === "ສີໂຄດຕະບອງ") {
        dummyBuildingsGeoJSON.features.push({
          type: "Feature",
          properties: { district: "ສີໂຄດຕະບອງ", name: "ອາຄານ 2" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [102.59, 17.94],
                [102.59, 17.95],
                [102.6, 17.95],
                [102.6, 17.94],
                [102.59, 17.94],
              ],
            ],
          },
        });
      }
      // Add more conditions for other districts as needed

      sourceRef.current.addFeatures(
        new GeoJSON().readFeatures(dummyBuildingsGeoJSON, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        })
      );
    }

    return () => {
      // Cleanup: remove layer when component unmounts
      if (map && layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
        sourceRef.current.clear(); // Clear source on unmount
        console.log("Building Layer removed from map.");
      }
    };
  }, [map, isVisible, selectedDistrict]); // Re-run effect if map, isVisible, or selectedDistrict changes

  return null;
};

export default BuildingLayer;
