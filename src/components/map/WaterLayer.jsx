// src/components/map/WaterLayer.jsx

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;
const FETCH_TIMEOUT = 15000;

const WaterLayer = ({
  map,
  isVisible,
  opacity,
  onLoadingChange,
  onErrorChange,
}) => {
  const layerRef = useRef(null);
  const sourceRef = useRef(new VectorSource());
  const retryTimeoutIdRef = useRef(null);
  const isFetchingRef = useRef(false);

  const waterStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({ color: "rgba(100, 150, 250, 0.7)" }), // Blue color for water
        stroke: new Stroke({ color: "#3366CC", width: 1.5 }),
      }),
    []
  );

  const fetchData = useCallback(
    async (attempt = 0) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      onLoadingChange(true);
      onErrorChange(null);
      clearTimeout(retryTimeoutIdRef.current);

      // Replace with your actual water data API endpoint
      const apiUrl = "https://msmapi.up.railway.app/api/rest/water_bodies";
      console.log(`[WaterLayer] Fetching water data (Attempt ${attempt + 1})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      try {
        const response = await fetch(apiUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Assuming data.water_bodies is an array of GeoJSON features
        if (data.water_bodies) {
          const features = new GeoJSON().readFeatures(
            {
              type: "FeatureCollection",
              features: data.water_bodies,
            },
            {
              featureProjection: "EPSG:3857", // Assuming data is in EPSG:4326 and map is in EPSG:3857
              dataProjection: "EPSG:4326",
            }
          );
          sourceRef.current.clear();
          sourceRef.current.addFeatures(features);
          console.log(`[WaterLayer] Loaded ${features.length} water features.`);
        } else {
          throw new Error("No water_bodies data found in response.");
        }
      } catch (error) {
        let errorMessage = `Failed to fetch water data: ${error.message}`;
        if (error.name === "AbortError") errorMessage = "Request timed out.";

        if (attempt < MAX_RETRIES) {
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
          onErrorChange(`${errorMessage} Retrying...`);
          retryTimeoutIdRef.current = setTimeout(
            () => fetchData(attempt + 1),
            delay
          );
        } else {
          onErrorChange(`Failed after ${MAX_RETRIES + 1} attempts.`);
        }
      } finally {
        clearTimeout(timeoutId);
        onLoadingChange(false);
        isFetchingRef.current = false;
      }
    },
    [onLoadingChange, onErrorChange]
  );

  useEffect(() => {
    if (!map) return;
    if (!layerRef.current) {
      layerRef.current = new VectorLayer({
        source: sourceRef.current,
        style: waterStyle,
        properties: { name: "water_layer" }, // Unique name for the layer
        zIndex: 2, // Adjust zIndex as needed to layer on top of base map but below roads/buildings
      });
      map.addLayer(layerRef.current);
    }
    layerRef.current.setVisible(isVisible);
    // Fetch data only if visible and not already loaded
    if (isVisible && sourceRef.current.getFeatures().length === 0) {
      fetchData();
    }
  }, [map, isVisible, fetchData, waterStyle]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setVisible(isVisible);
      layerRef.current.setOpacity(opacity);
    }
    return () => {
      // Cleanup: clear timeout if component unmounts during a retry
      clearTimeout(retryTimeoutIdRef.current);
    };
  }, [isVisible, opacity]);

  return null; // This component doesn't render any visible DOM elements itself
};

export default WaterLayer;
