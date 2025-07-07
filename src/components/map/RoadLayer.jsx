import React, { useEffect, useRef, useMemo, useCallback } from "react"; // import hooks ທີ່ຈຳເປັນຈາກ React
import VectorLayer from "ol/layer/Vector"; // import VectorLayer ຈາກ OpenLayers ສຳລັບສ້າງ layer ຂອງ vector data
import VectorSource from "ol/source/Vector"; // import VectorSource ຈາກ OpenLayers ສຳລັບແຫຼ່ງຂໍ້ມູນ vector
import GeoJSON from "ol/format/GeoJSON"; // import GeoJSON ຈາກ OpenLayers ສຳລັບການອ່ານຂໍ້ມູນ GeoJSON
import { Stroke, Style } from "ol/style"; // import Stroke ແລະ Style ຈາກ OpenLayers ສຳລັບການກຳນົດ style ຂອງ feature

const MAX_RETRIES = 3; // ຈຳນວນຄັ້ງສູງສຸດທີ່ຈະລອງ fetch ຂໍ້ມູນໃໝ່ຖ້າມີ error
const BASE_RETRY_DELAY = 1000; // ໄລຍະເວລາລໍຖ້າກ່ອນທີ່ຈະລອງໃໝ່ຄັ້ງທຳອິດ (in milliseconds)
const FETCH_TIMEOUT = 15000; // ໄລຍະເວລາສູງສຸດໃນການ fetch ຂໍ້ມູນກ່ອນທີ່ຈະ timeout (in milliseconds)

const RoadLayer = ({
  map, // object ແຜນທີ່ OpenLayers
  isVisible, // ກຳນົດວ່າ layer ຄວນເຫັນໄດ້ຫຼືບໍ່
  opacity, // ຄວາມໂປ່ງໃສຂອງ layer
  onLoadingChange, // callback function ເມື່ອສະຖານະການໂຫຼດຂໍ້ມູນປ່ຽນແປງ
  onErrorChange, // callback function ເມື່ອມີ error ເກີດຂຶ້ນ
}) => {
  const layerRef = useRef(null); // useRef ເກັບ reference ຂອງ OpenLayers VectorLayer
  const sourceRef = useRef(new VectorSource()); // useRef ເກັບ reference ຂອງ OpenLayers VectorSource
  const retryTimeoutIdRef = useRef(null); // useRef ເກັບ ID ຂອງ setTimeout ສຳລັບການ retry
  const isFetchingRef = useRef(false); // useRef ເກັບ state ວ່າກຳລັງ fetch ຂໍ້ມູນຢູ່ບໍ່

  const roadStyle = useMemo(
    // useMemo ເພື່ອກຳນົດ style ຂອງເສັ້ນທາງ (ຖະໜົນ) ແລະຮັບປະກັນວ່າມັນຈະຖືກສ້າງຂຶ້ນພຽງຄັ້ງດຽວ
    () => new Style({ stroke: new Stroke({ color: "#DAA520", width: 2.5 }) }), // ສີເຫຼືອງທອງ ແລະຄວາມໜາ 2.5
    []
  );

  const fetchData = useCallback(
    // useCallback ເພື່ອປ້ອງກັນບໍ່ໃຫ້ fetchData ຖືກສ້າງໃໝ່ທຸກຄັ້ງທີ່ component re-render
    async (attempt = 0) => {
      // attempt: ຈຳນວນຄັ້ງທີ່ໄດ້ລອງ fetch ມາແລ້ວ
      if (isFetchingRef.current) return; // ຖ້າກຳລັງ fetch ຢູ່, ບໍ່ຕ້ອງເຮັດຫຍັງ
      isFetchingRef.current = true; // ຕັ້ງຄ່າວ່າກຳລັງ fetch
      onLoadingChange(true); // ແຈ້ງເຕືອນວ່າເລີ່ມໂຫຼດ
      onErrorChange(null); // ລ້າງ error ເກົ່າ
      clearTimeout(retryTimeoutIdRef.current); // ລ້າງ timeout ການ retry ທີ່ອາດຈະມີຢູ່

      const apiUrl = "https://msmapi.up.railway.app/api/rest/roads"; // URL API ສຳລັບຂໍ້ມູນຖະໜົນ
      console.log(`[RoadLayer] Fetching road data (Attempt ${attempt + 1})`); // ສະແດງ log ການ fetch

      const controller = new AbortController(); // ສ້າງ AbortController ສຳລັບການຍົກເລີກ request
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT); // ຕັ້ງ timeout ສຳລັບການຍົກເລີກ request

      try {
        const response = await fetch(apiUrl, { signal: controller.signal }); // fetch ຂໍ້ມູນດ້ວຍ signal ສຳລັບ timeout
        clearTimeout(timeoutId); // ລ້າງ timeout ເມື່ອ fetch ສຳເລັດ

        if (!response.ok)
          // ຖ້າ response ບໍ່ສຳເລັດ (HTTP status ບໍ່ແມ່ນ 2xx)
          throw new Error(`HTTP error! Status: ${response.status}`); // ຖິ້ມ error

        const data = await response.json(); // ປ່ຽນ response ເປັນ JSON
        // --- FIX: Explicitly access the correct key from the API response ---
        const featureArray = data.cadastre_roads_in_vientiane_bbox; // ເຂົ້າເຖິງ key ທີ່ຖືກຕ້ອງຂອງຂໍ້ມູນຖະໜົນ

        if (!featureArray || !Array.isArray(featureArray)) {
          // ກວດສອບວ່າ featureArray ບໍ່ຫວ່າງ ແລະເປັນ array
          throw new Error(
            "Invalid data format: 'cadastre_roads_in_vientiane_bbox' array not found."
          ); // ຖິ້ມ error ຖ້າ format ບໍ່ຖືກຕ້ອງ
        }

        const geoJsonFormat = new GeoJSON(); // ສ້າງ GeoJSON formatter
        const features = geoJsonFormat.readFeatures(
          // ອ່ານ features ຈາກຂໍ້ມູນ GeoJSON
          {
            type: "FeatureCollection",
            features: featureArray.map((item) => ({
              type: "Feature",
              geometry: item.wkb_geometry, // ໃຊ້ key geometry ທີ່ຖືກຕ້ອງ
              properties: { ...item, wkb_geometry: undefined }, // ສ້າງ properties, ຍົກເວັ້ນ wkb_geometry
            })),
          },
          { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" } // ກໍານົດ projection ຂອງຂໍ້ມູນຕົ້ນສະບັບ ແລະ projection ທີ່ຕ້ອງການ
        );

        // --- FIX: Set a unique ID for each feature ---
        features.forEach((feature, index) => {
          // loop ຜ່ານແຕ່ລະ feature
          const osmId = feature.get("osm_id"); // ດຶງ osm_id
          // Use a prefix and index to guarantee a unique ID
          feature.setId(`road-${osmId}-${index}`); // ຕັ້ງ ID ທີ່ເປັນເອກະລັກໃຫ້ແຕ່ລະ feature
        });

        console.log(
          `[RoadLayer] Parsed and set IDs for ${features.length} road features.`
        ); // ສະແດງ log ຈຳນວນ features ທີ່ຖືກ parse

        sourceRef.current.clear(); // ລ້າງ source ເກົ່າ
        sourceRef.current.addFeatures(features); // ເພີ່ມ features ໃໝ່ເຂົ້າໄປໃນ source
        onErrorChange(null); // ລ້າງ error
      } catch (error) {
        // ຈັດການກັບ error
        console.error(`[RoadLayer] Error loading road data:`, error); // ສະແດງ error ໃນ console
        let errorMessage = `Failed to load road data: ${error.message}`; // ສ້າງຂໍ້ຄວາມ error
        if (error.name === "AbortError") errorMessage = "Request timed out."; // ຖ້າ error ເປັນ AbortError, ແປວ່າ timeout

        if (attempt < MAX_RETRIES) {
          // ຖ້າຍັງບໍ່ເກີນຈຳນວນຄັ້ງທີ່ລອງສູງສຸດ
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt); // ຄິດໄລ່ delay ແບບ exponential backoff
          onErrorChange(`${errorMessage} Retrying...`); // ແຈ້ງເຕືອນວ່າກຳລັງ retry
          retryTimeoutIdRef.current = setTimeout(
            () => fetchData(attempt + 1),
            delay
          ); // ຕັ້ງ setTimeout ເພື່ອລອງ fetch ໃໝ່
        } else {
          onErrorChange(`Failed after ${MAX_RETRIES + 1} attempts.`); // ແຈ້ງເຕືອນວ່າລົ້ມເຫຼວຫຼັງຈາກລອງຫຼາຍຄັ້ງ
        }
      } finally {
        onLoadingChange(false); // ແຈ້ງເຕືອນວ່າສິ້ນສຸດການໂຫຼດ
        isFetchingRef.current = false; // ຕັ້ງຄ່າວ່າບໍ່ໄດ້ກຳລັງ fetch ແລ້ວ
      }
    },
    [onLoadingChange, onErrorChange]
  ); // Dependencies ສຳລັບ useCallback

  useEffect(() => {
    // useEffect ນີ້ຈະເຮັດວຽກເມື່ອ map, isVisible, fetchData, roadStyle ປ່ຽນແປງ
    if (!map) return; // ຖ້າບໍ່ມີ map, ບໍ່ຕ້ອງເຮັດຫຍັງ
    if (!layerRef.current) {
      // ຖ້າ layer ຍັງບໍ່ໄດ້ຖືກສ້າງ
      layerRef.current = new VectorLayer({
        // ສ້າງ VectorLayer ໃໝ່
        source: sourceRef.current, // ໃຊ້ source ທີ່ສ້າງໄວ້
        style: roadStyle, // ໃຊ້ style ທີ່ກຳນົດໄວ້
        properties: { name: "road_layer" }, // ກຳນົດ properties ຂອງ layer
        zIndex: 5, // ກຳນົດ zIndex ເພື່ອຄວບຄຸມລຳດັບການສະແດງຜົນ
      });
      map.addLayer(layerRef.current); // ເພີ່ມ layer ເຂົ້າໄປໃນແຜນທີ່
    }
    layerRef.current.setVisible(isVisible); // ຕັ້ງຄ່າການເບິ່ງເຫັນຂອງ layer
    if (isVisible && sourceRef.current.getFeatures().length === 0) {
      // ຖ້າ layer ເຫັນໄດ້ ແລະຍັງບໍ່ມີ features
      fetchData(); // ເລີ່ມຕົ້ນ fetch ຂໍ້ມູນ
    }
  }, [map, isVisible, fetchData, roadStyle]);

  // 2. useEffect ສໍາລັບການເປີດ/ປິດ Layer
  useEffect(() => {
    // useEffect ນີ້ຈະເຮັດວຽກເມື່ອ isVisible ປ່ຽນແປງ
    if (layerRef.current) {
      // ຖ້າມີ layer
      layerRef.current.setVisible(isVisible); // ຕັ້ງຄ່າການເບິ່ງເຫັນຂອງ layer
    }
  }, [isVisible]);

  // 3. useEffect ສໍາລັບການປັບ Opacity
  useEffect(() => {
    // useEffect ນີ້ຈະເຮັດວຽກເມື່ອ opacity ປ່ຽນແປງ
    if (layerRef.current) {
      // ຖ້າມີ layer
      layerRef.current.setOpacity(opacity); // ຕັ້ງຄ່າຄວາມໂປ່ງໃສຂອງ layer
    }
  }, [opacity]);

  return null; // component ນີ້ບໍ່ໄດ້ render ອົງປະກອບ UI ໃດໆ
};

export default RoadLayer; // export RoadLayer component
