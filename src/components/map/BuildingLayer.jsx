import React, { useEffect, useRef, useMemo, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";

const MIN_LOADING_TIME = 500; // milliseconds
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1 second
const FETCH_TIMEOUT = 10000; // 10 seconds timeout for fetch requests

// Dummy GeoJSON data for testing if API fails or returns empty
const dummyBuildingsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Dummy Building A" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [102.61, 17.97],
            [102.62, 17.97],
            [102.62, 17.96],
            [102.61, 17.96],
            [102.61, 17.97],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Dummy Building B" },
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
    },
  ],
};

const BuildingLayer = ({
  map,
  isVisible,
  selectedDistrict,
  mapExtent,
  onLoadingChange,
  onErrorChange,
}) => {
  const layerRef = useRef(null);
  const sourceRef = useRef(new VectorSource());
  const retryTimeoutIdRef = useRef(null);
  const hasFetchedOnceRef = useRef(false);
  const loadingStartTimeRef = useRef(0);

  const buildingStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({
          color: "rgba(200, 200, 200, 0.6)", // Light gray with some transparency
        }),
        stroke: new Stroke({
          color: "#555", // Darker gray border
          width: 1,
        }),
      }),
    []
  );

  const finishLoading = useCallback(() => {
    const elapsed = Date.now() - loadingStartTimeRef.current;
    const remainingTime = MIN_LOADING_TIME - elapsed;

    if (remainingTime > 0) {
      setTimeout(() => {
        onLoadingChange(false);
        console.log(
          `[BuildingLayer] Loading finished after minimum display time.`
        );
      }, remainingTime);
    } else {
      onLoadingChange(false);
      console.log(`[BuildingLayer] Loading finished instantly.`);
    }
  }, [onLoadingChange]);

  const fetchData = useCallback(
    async (attempt = 0) => {
      loadingStartTimeRef.current = Date.now();
      onLoadingChange(true);
      onErrorChange(null);
      clearTimeout(retryTimeoutIdRef.current);

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/rest/buildings`;
      console.log(
        `[BuildingLayer] Attempting to fetch building data (${attempt + 1}/${
          MAX_RETRIES + 1
        }) from: ${apiUrl}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(
          `[BuildingLayer] Fetch request for ${apiUrl} timed out after ${
            FETCH_TIMEOUT / 1000
          } seconds.`
        );
      }, FETCH_TIMEOUT);

      try {
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        console.log(
          `[BuildingLayer] API Response Status for ${apiUrl}:`,
          response.status
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error(
            `[BuildingLayer] API Error Response for ${apiUrl} (Status ${response.status}):`,
            errorData
          );
          throw new Error(
            `HTTP error! Status: ${response.status} - ${
              response.statusText || "Unknown Error"
            }. Details: ${errorData}`
          );
        }

        const data = await response.json();
        console.log(`[BuildingLayer] API Data Received for ${apiUrl}:`, data);

        let features = [];
        let featureArray = null;
        let dataKeyFound = null;

        // Flexibly find the array containing feature data
        for (const key in data) {
          if (
            Object.prototype.hasOwnProperty.call(data, key) &&
            Array.isArray(data[key])
          ) {
            featureArray = data[key];
            dataKeyFound = key;
            break;
          }
        }

        if (featureArray) {
          if (featureArray.length === 0) {
            console.warn(
              `[BuildingLayer] API returned an empty array for buildings under key '${dataKeyFound}'.`
            );
          } else {
            console.log(
              `[BuildingLayer] API returned ${featureArray.length} features for buildings under key '${dataKeyFound}'.`
            );
          }

          const geoJsonFormat = new GeoJSON();
          features = geoJsonFormat.readFeatures(
            {
              type: "FeatureCollection",
              features: featureArray.map((item) => ({
                type: "Feature",
                geometry: item.geometry || item.wkb_geometry, // Use geometry or wkb_geometry
                properties: item.properties || {
                  ...item,
                  geometry: undefined,
                  wkb_geometry: undefined,
                }, // Copy all properties, exclude geometry fields
              })),
            },
            {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            }
          );

          console.log(
            `[BuildingLayer] Parsed ${features.length} features after transformation.`
          );
        } else {
          console.error(
            `[BuildingLayer] Invalid API response format: Expected an object with a 'features' array or a single top-level array, but got:`,
            data
          );
          throw new Error(
            "Invalid data format: no feature array found in response."
          );
        }

        sourceRef.current.clear();
        if (features.length > 0) {
          sourceRef.current.addFeatures(features);
          console.log(
            `[BuildingLayer] Added ${features.length} building features to layer.`
          );
          hasFetchedOnceRef.current = true;
        } else {
          console.log(
            "[BuildingLayer] No features parsed from API. Loading dummy data for visualization."
          );
          const dummyFeatures = new GeoJSON().readFeatures(
            dummyBuildingsGeoJSON,
            {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            }
          );
          sourceRef.current.addFeatures(dummyFeatures);
          console.log(
            `[BuildingLayer] Loaded ${dummyFeatures.length} dummy building features.`
          );
        }
        onErrorChange(null);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[BuildingLayer] Error loading building data:`, error);

        let errorMessage = `Failed to load building data: ${error.message}`;
        if (error.name === "AbortError") {
          errorMessage = `Request timed out or was aborted: ${error.message}`;
        } else if (error.message.startsWith("HTTP error!")) {
          errorMessage = `Server error: ${error.message}`;
        } else if (error.message.includes("Invalid data format")) {
          errorMessage = `API data format error: ${error.message}`;
        }
        onErrorChange(errorMessage);

        sourceRef.current.clear();
        const dummyFeatures = new GeoJSON().readFeatures(
          dummyBuildingsGeoJSON,
          {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          }
        );
        sourceRef.current.addFeatures(dummyFeatures);
        console.log(
          `[BuildingLayer] Loaded ${dummyFeatures.length} dummy building features as fallback due to error.`
        );

        if (attempt < MAX_RETRIES && error.name !== "AbortError") {
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`[BuildingLayer] Retrying in ${delay / 1000} seconds...`);
          onErrorChange(
            `${errorMessage}. Retrying (${attempt + 1}/${MAX_RETRIES}).`
          );
          retryTimeoutIdRef.current = setTimeout(() => {
            fetchData(attempt + 1);
          }, delay);
        } else {
          onErrorChange(
            `Failed to load building data after ${
              MAX_RETRIES + 1
            } attempts: ${errorMessage}. Displaying dummy data.`
          );
        }
      } finally {
        finishLoading();
      }
    },
    [onLoadingChange, onErrorChange, finishLoading]
  );

  useEffect(() => {
    console.log(
      `[BuildingLayer] useEffect running. isVisible: ${isVisible}, selectedDistrict: ${selectedDistrict}, mapExtent: ${
        mapExtent ? mapExtent.join(",") : "null"
      }`
    );
    console.log(
      `[BuildingLayer] Current mapExtent value: ${JSON.stringify(mapExtent)}`
    );
    console.log(
      `[BuildingLayer] Current selectedDistrict: ${selectedDistrict}`
    );

    if (!map) {
      console.log(
        "[BuildingLayer] Map instance is not available. Skipping layer logic."
      );
      return;
    }

    if (!layerRef.current) {
      layerRef.current = new VectorLayer({
        source: sourceRef.current,
        style: buildingStyle,
        properties: { name: "building_layer" },
        zIndex: 4,
      });
      map.addLayer(layerRef.current);
      console.log("[BuildingLayer] Building Layer added to map.");
    }

    layerRef.current.setVisible(isVisible);
    console.log(`[BuildingLayer] Layer visibility set to: ${isVisible}`);

    if (!isVisible) {
      if (sourceRef.current.getFeatures().length > 0) {
        console.log("[BuildingLayer] Clearing source due to invisibility.");
        sourceRef.current.clear();
      }
      hasFetchedOnceRef.current = false;
      onLoadingChange(false);
      onErrorChange(null);
      clearTimeout(retryTimeoutIdRef.current);
      console.log(
        "[BuildingLayer] Layer not visible. Exiting useEffect logic."
      );
      return;
    }

    if (isVisible && !hasFetchedOnceRef.current) {
      console.log(
        `[BuildingLayer] Layer is visible and data not yet fetched. Calling fetchData.`
      );
      fetchData();
    } else if (isVisible && hasFetchedOnceRef.current) {
      console.log(
        `[BuildingLayer] Layer is visible and data already fetched. No new fetch needed.`
      );
      onLoadingChange(false);
      onErrorChange(null);
      if (layerRef.current) {
        layerRef.current.setVisible(isVisible);
      }
    } else {
      console.log(
        `[BuildingLayer] Fetch conditions not met: isVisible=${isVisible}, hasFetchedOnce=${hasFetchedOnceRef.current}.`
      );
      onLoadingChange(false);
    }

    return () => {
      console.log("[BuildingLayer] Cleanup function running.");
      clearTimeout(retryTimeoutIdRef.current);
      if (
        map &&
        layerRef.current &&
        map.getLayers().getArray().includes(layerRef.current)
      ) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
        console.log(
          "[BuildingLayer] Building Layer removed from map on cleanup."
        );
      }
    };
  }, [
    map,
    isVisible,
    fetchData,
    buildingStyle,
    onLoadingChange,
    onErrorChange,
    selectedDistrict,
    mapExtent,
  ]);

  return null;
};

export default BuildingLayer;
