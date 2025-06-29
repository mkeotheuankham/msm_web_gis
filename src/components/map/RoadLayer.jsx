import React, { useEffect, useRef, useMemo, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Stroke, Style } from "ol/style";

const MIN_LOADING_TIME = 500; // ມິນລິວິນາທີ
const MAX_RETRIES = 3; // ຈຳນວນຄັ້ງສູງສຸດໃນການລອງໃໝ່
const BASE_RETRY_DELAY = 1000; // 1 ວິນາທີ
const FETCH_TIMEOUT = 10000; // 10 ວິນາທີສຳລັບ timeout ຂອງການ fetch

// ຂໍ້ມູນ GeoJSON ແບບ dummy ສໍາລັບການທົດສອບ ຖ້າ API ລົ້ມເຫລວ ຫຼື ກັບຄືນຄ່າເປົ່າ
const dummyRoadsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Dummy Road 1" },
      geometry: {
        type: "LineString",
        coordinates: [
          [102.61, 17.97],
          [102.62, 17.98],
          [102.63, 17.97],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Dummy Road 2" },
      geometry: {
        type: "LineString",
        coordinates: [
          [102.59, 17.95],
          [102.6, 17.94],
          [102.61, 17.95],
        ],
      },
    },
  ],
};

const RoadLayer = ({
  map,
  isVisible,
  selectedProvince,
  mapExtent,
  onLoadingChange,
  onErrorChange,
}) => {
  const layerRef = useRef(null);
  const sourceRef = useRef(new VectorSource());
  const retryTimeoutIdRef = useRef(null);
  const hasFetchedOnceRef = useRef(false);
  const loadingStartTimeRef = useRef(0);

  // Style ສໍາລັບເສັ້ນທາງ, ໃຊ້ useMemo ເພື່ອປ້ອງກັນການສ້າງໃໝ່ທີ່ບໍ່ຈໍາເປັນ
  const roadStyle = useMemo(
    () =>
      new Style({
        stroke: new Stroke({
          color: "#8B4513", // ສີນໍ້າຕານ
          width: 3,
        }),
      }),
    []
  );

  // ຟັງຊັນເພື່ອສິ້ນສຸດການໂຫຼດຂໍ້ມູນ, ຮັບປະກັນເວລາໂຫຼດຂັ້ນຕ່ໍາ
  const finishLoading = useCallback(() => {
    const elapsed = Date.now() - loadingStartTimeRef.current;
    const remainingTime = MIN_LOADING_TIME - elapsed;

    if (remainingTime > 0) {
      setTimeout(() => {
        onLoadingChange(false);
        console.log(`[RoadLayer] Loading finished after minimum display time.`);
      }, remainingTime);
    } else {
      onLoadingChange(false);
      console.log(`[RoadLayer] Loading finished instantly.`);
    }
  }, [onLoadingChange]);

  // ຟັງຊັນການດຶງຂໍ້ມູນ, ລວມມີ logic ການລອງໃໝ່ແລະ timeout
  const fetchData = useCallback(
    async (attempt = 0) => {
      loadingStartTimeRef.current = Date.now();
      onLoadingChange(true); // ຕັ້ງຄ່າສະຖານະການໂຫຼດເປັນ true
      onErrorChange(null); // ລ້າງຂໍ້ຜິດພາດກ່ອນໜ້າ
      clearTimeout(retryTimeoutIdRef.current); // ລ້າງ timer ການລອງໃໝ່ທີ່ຍັງຄ້າງຢູ່

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/rest/roads`;
      console.log(
        `[RoadLayer] Attempting to fetch road data (${attempt + 1}/${
          MAX_RETRIES + 1
        }) from: ${apiUrl}`
      );

      // ສ້າງ AbortController ສໍາລັບການຈັດການ timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(); // ຍົກເລີກການຮ້ອງຂໍຖ້າມັນໃຊ້ເວລາດົນເກີນໄປ
        console.warn(
          `[RoadLayer] Fetch request for ${apiUrl} timed out after ${
            FETCH_TIMEOUT / 1000
          } seconds.`
        );
      }, FETCH_TIMEOUT);

      try {
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId); // ລ້າງ timer timeout ຖ້າການຮ້ອງຂໍສໍາເລັດ

        console.log(
          `[RoadLayer] API Response Status for ${apiUrl}:`,
          response.status
        );

        if (!response.ok) {
          const errorData = await response.text(); // ດຶງຂໍ້ຄວາມຜິດພາດດິບ
          console.error(
            `[RoadLayer] API Error Response for ${apiUrl} (Status ${response.status}):`,
            errorData
          );
          throw new Error(
            `HTTP error! Status: ${response.status} - ${
              response.statusText || "Unknown Error"
            }. Details: ${errorData}`
          );
        }

        const data = await response.json();
        console.log(`[RoadLayer] API Data Received for ${apiUrl}:`, data);

        let features = [];
        let featureArray = null;
        let dataKeyFound = null;

        // ຊອກຫາ array ທີ່ມີຂໍ້ມູນ feature ຢ່າງຍືດຫຍຸ່ນ
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
              `[RoadLayer] API returned an empty array for roads under key '${dataKeyFound}'.`
            );
          } else {
            console.log(
              `[RoadLayer] API returned ${featureArray.length} features for roads under key '${dataKeyFound}'.`
            );
          }

          const geoJsonFormat = new GeoJSON();
          // ອ່ານ features, ປັບ geometry ຈາກ wkb_geometry ເປັນ geometry
          features = geoJsonFormat.readFeatures(
            {
              type: "FeatureCollection",
              features: featureArray.map((item) => ({
                type: "Feature",
                geometry: item.geometry || item.wkb_geometry, // ໃຊ້ geometry ຫຼື wkb_geometry
                properties: item.properties || {
                  ...item,
                  geometry: undefined,
                  wkb_geometry: undefined,
                }, // ສໍາເນົາຄຸນສົມບັດທັງໝົດ, ຍົກເວັ້ນ geometry fields
              })),
            },
            {
              dataProjection: "EPSG:4326", // ຂໍ້ມູນ API ຢູ່ໃນ EPSG:4326
              featureProjection: "EPSG:3857", // ແປງເປັນ EPSG:3857 ສໍາລັບ OpenLayers
            }
          );
          console.log(
            `[RoadLayer] Parsed ${features.length} features after transformation.`
          );
        } else {
          console.error(
            `[RoadLayer] Invalid API response format: Expected an object with a 'features' array or a single top-level array, but got:`,
            data
          );
          throw new Error(
            "Invalid data format: no feature array found in response."
          );
        }

        sourceRef.current.clear(); // ລ້າງ source ກ່ອນເພີ່ມ features ໃໝ່
        if (features.length > 0) {
          sourceRef.current.addFeatures(features); // ເພີ່ມ features ທີ່ວິເຄາະແລ້ວ
          console.log(
            `[RoadLayer] Added ${features.length} road features to layer.`
          );
          hasFetchedOnceRef.current = true; // ໝາຍວ່າໄດ້ດຶງຂໍ້ມູນສໍາເລັດແລ້ວ
        } else {
          console.log(
            "[RoadLayer] No features parsed from API. Loading dummy data for visualization."
          );
          // ໂຫຼດຂໍ້ມູນ dummy ຖ້າບໍ່ມີ features ຈາກ API
          const dummyFeatures = new GeoJSON().readFeatures(dummyRoadsGeoJSON, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
          sourceRef.current.addFeatures(dummyFeatures);
          console.log(
            `[RoadLayer] Loaded ${dummyFeatures.length} dummy road features.`
          );
        }
        onErrorChange(null); // ລ້າງຂໍ້ຜິດພາດເມື່ອຂໍ້ມູນໂຫຼດສຳເລັດ
      } catch (error) {
        clearTimeout(timeoutId); // ລ້າງ timer timeout ເພື່ອປ້ອງກັນການ trigger ຊໍ້າ
        console.error(`[RoadLayer] Error loading road data:`, error);

        let errorMessage = `Failed to load road data: ${error.message}`;
        if (error.name === "AbortError") {
          errorMessage = `Request timed out or was aborted: ${error.message}`;
        } else if (error.message.startsWith("HTTP error!")) {
          errorMessage = `Server error: ${error.message}`;
        } else if (error.message.includes("Invalid data format")) {
          errorMessage = `API data format error: ${error.message}`;
        }
        onErrorChange(errorMessage); // ຕັ້ງຂໍ້ຄວາມຜິດພາດ

        sourceRef.current.clear(); // ລ້າງ source ແລະເພີ່ມຂໍ້ມູນ dummy ເປັນ fallback
        const dummyFeatures = new GeoJSON().readFeatures(dummyRoadsGeoJSON, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });
        sourceRef.current.addFeatures(dummyFeatures);
        console.log(
          `[RoadLayer] Loaded ${dummyFeatures.length} dummy road features as fallback due to error.`
        );

        // Retry logic
        if (attempt < MAX_RETRIES && error.name !== "AbortError") {
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`[RoadLayer] Retrying in ${delay / 1000} seconds...`);
          onErrorChange(
            `${errorMessage}. Retrying (${attempt + 1}/${MAX_RETRIES}).`
          );
          retryTimeoutIdRef.current = setTimeout(() => {
            fetchData(attempt + 1);
          }, delay);
        } else {
          onErrorChange(
            `Failed to load road data after ${
              MAX_RETRIES + 1
            } attempts: ${errorMessage}. Displaying dummy data.`
          );
        }
      } finally {
        finishLoading(); // ສິ້ນສຸດສະຖານະການໂຫຼດ
      }
    },
    [onLoadingChange, onErrorChange, finishLoading]
  );

  // useEffect ຕົ້ນຕໍສໍາລັບການຈັດການ lifecycle ຂອງ layer ແລະການດຶງຂໍ້ມູນ
  useEffect(() => {
    console.log(
      `[RoadLayer] useEffect running. isVisible: ${isVisible}, selectedProvince: ${selectedProvince}, mapExtent: ${
        mapExtent ? mapExtent.join(",") : "null"
      }`
    );
    console.log(
      `[RoadLayer] Current mapExtent value: ${JSON.stringify(mapExtent)}`
    );
    console.log(`[RoadLayer] Current selectedProvince: ${selectedProvince}`);

    if (!map) {
      console.log(
        "[RoadLayer] Map instance is not available. Skipping layer logic."
      );
      return;
    }

    // ສ້າງ layer ຖ້າຍັງບໍ່ມີ
    if (!layerRef.current) {
      layerRef.current = new VectorLayer({
        source: sourceRef.current,
        style: roadStyle,
        properties: { name: "road_layer" },
        zIndex: 5, // ຕັ້ງຄ່າ zIndex ເພື່ອໃຫ້ມັນຢູ່ເທິງ layers ອື່ນ
      });
      map.addLayer(layerRef.current);
      console.log("[RoadLayer] Layer added to map for the first time.");
    }

    // ຕັ້ງຄ່າການເບິ່ງເຫັນຂອງ layer
    layerRef.current.setVisible(isVisible);
    console.log(`[RoadLayer] Layer visibility set to: ${isVisible}`);

    // ຖ້າ layer ບໍ່ສາມາດເບິ່ງເຫັນໄດ້, ໃຫ້ລ້າງ source ແລະ reset ສະຖານະ
    if (!isVisible) {
      if (sourceRef.current.getFeatures().length > 0) {
        console.log("[RoadLayer] Clearing source: layer invisible.");
        sourceRef.current.clear();
      }
      hasFetchedOnceRef.current = false;
      onLoadingChange(false);
      onErrorChange(null);
      clearTimeout(retryTimeoutIdRef.current);
      console.log("[RoadLayer] Layer not visible. Exiting useEffect logic.");
      return;
    }

    // ຖ້າ layer ສາມາດເບິ່ງເຫັນໄດ້ ແລະ ຂໍ້ມູນຍັງບໍ່ຖືກດຶງເທື່ອ, ໃຫ້ດຶງຂໍ້ມູນ
    if (isVisible && !hasFetchedOnceRef.current) {
      console.log(
        `[RoadLayer] Layer is visible and data not yet fetched. Calling fetchData.`
      );
      fetchData();
    } else if (isVisible && hasFetchedOnceRef.current) {
      // ຖ້າ layer ສາມາດເບິ່ງເຫັນໄດ້ ແລະ ຂໍ້ມູນຖືກດຶງມາແລ້ວ, ບໍ່ຕ້ອງດຶງອີກ
      console.log(
        `[RoadLayer] Layer is visible and data already fetched. No new fetch needed.`
      );
      onLoadingChange(false);
      onErrorChange(null);
      if (layerRef.current) {
        layerRef.current.setVisible(isVisible);
      }
    } else {
      // ເງື່ອນໄຂການດຶງຂໍ້ມູນບໍ່ກົງກັນ
      console.log(
        `[RoadLayer] Fetch conditions not met: isVisible: ${isVisible}, hasFetchedOnce: ${hasFetchedOnceRef.current}.`
      );
      onLoadingChange(false);
    }

    // ຟັງຊັນ cleanup
    return () => {
      console.log("[RoadLayer] Cleanup function running.");
      clearTimeout(retryTimeoutIdRef.current); // ລ້າງ timer ການລອງໃໝ່
      // ລົບ layer ອອກຈາກແຜນທີ່ເມື່ອ component ຖືກ unmount
      if (
        map &&
        layerRef.current &&
        map.getLayers().getArray().includes(layerRef.current)
      ) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
        console.log("[RoadLayer] Layer removed from map on cleanup.");
      }
    };
  }, [
    map,
    isVisible,
    fetchData,
    roadStyle,
    onLoadingChange,
    onErrorChange,
    selectedProvince,
    mapExtent,
  ]); // Dependencies ສໍາລັບ useEffect

  return null; // Component ນີ້ບໍ່ render ຫຍັງເລີຍ
};

export default RoadLayer;
