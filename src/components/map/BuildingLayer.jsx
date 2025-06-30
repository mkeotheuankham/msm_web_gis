import React, { useEffect, useRef, useMemo, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;
const FETCH_TIMEOUT = 15000;

const BuildingLayer = ({ map, isVisible, onLoadingChange, onErrorChange }) => {
  const layerRef = useRef(null);
  const sourceRef = useRef(new VectorSource());
  const retryTimeoutIdRef = useRef(null);
  const isFetchingRef = useRef(false);

  const buildingStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({ color: "rgba(200, 200, 200, 0.6)" }),
        stroke: new Stroke({ color: "#555", width: 1 }),
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

      const apiUrl = "https://msmapi.up.railway.app/api/rest/buildings";
      console.log(
        `[BuildingLayer] Attempting to fetch building data (Attempt ${
          attempt + 1
        }) from: ${apiUrl}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      try {
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("[BuildingLayer] API Data Received:", data);

        // --- FIX: Explicitly access the correct key from the API response ---
        const featureArray = data.cadastre_buildings_in_vientiane_bbox;

        if (!featureArray || !Array.isArray(featureArray)) {
          throw new Error(
            "Invalid data format: 'cadastre_buildings_in_vientiane_bbox' array not found."
          );
        }

        console.log(
          `[BuildingLayer] Found ${featureArray.length} items in the feature array.`
        );

        const geoJsonFormat = new GeoJSON();
        const features = geoJsonFormat.readFeatures(
          {
            type: "FeatureCollection",
            features: featureArray.map((item) => ({
              type: "Feature",
              geometry: item.wkb_geometry, // Use the correct geometry key
              properties: { ...item, wkb_geometry: undefined },
            })),
          },
          {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          }
        );

        console.log(
          `[BuildingLayer] Successfully parsed ${features.length} building features.`
        );

        sourceRef.current.clear();
        sourceRef.current.addFeatures(features);
        onErrorChange(null);
      } catch (error) {
        console.error(`[BuildingLayer] Error loading building data:`, error);
        let errorMessage = `Failed to load building data: ${error.message}`;
        if (error.name === "AbortError") errorMessage = "Request timed out.";

        if (attempt < MAX_RETRIES) {
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
          onErrorChange(`${errorMessage} Retrying...`);
          retryTimeoutIdRef.current = setTimeout(
            () => fetchData(attempt + 1),
            delay
          );
        } else {
          onErrorChange(
            `Failed to load building data after ${MAX_RETRIES + 1} attempts.`
          );
        }
      } finally {
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
        style: buildingStyle,
        properties: { name: "building_layer" },
        zIndex: 4,
      });
      map.addLayer(layerRef.current);
    }

    layerRef.current.setVisible(isVisible);

    if (isVisible && sourceRef.current.getFeatures().length === 0) {
      fetchData();
    }
  }, [map, isVisible, fetchData, buildingStyle]);

  return null;
};

export default BuildingLayer;
