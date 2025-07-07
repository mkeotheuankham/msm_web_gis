import React, { useEffect, useRef, useCallback } from "react"; // import hooks ທີ່ຈຳເປັນຈາກ React
import VectorLayer from "ol/layer/Vector"; // import VectorLayer ສຳລັບສ້າງ layer ຂອງ vector data
import VectorSource from "ol/source/Vector"; // import VectorSource ສຳລັບແຫຼ່ງຂໍ້ມູນ vector
import GeoJSON from "ol/format/GeoJSON"; // import GeoJSON ສຳລັບການອ່ານຂໍ້ມູນ GeoJSON
import { Fill, Stroke, Style, Text } from "ol/style"; // import Fill, Stroke, Style, Text ສຳລັບການກຳນົດ style ຂອງ feature ແລະ text
import { unByKey } from "ol/Observable"; // import unByKey ສຳລັບການລຶບ event listener

const ParcelLayerControl = ({
  map, // object ແຜນທີ່ OpenLayers
  districts, // ລາຍຊື່ເມືອງ (districts) ທີ່ຖືກກວດສອບ (checked) ຈາກ App.jsx
  setDistricts, // setter function ສຳລັບ update state ຂອງ districts
  onParcelSelect, // callback function ເມື່ອມີການເລືອກແປງທີ່ດິນ
  loadTrigger, // trigger ສຳລັບການໂຫຼດຂໍ້ມູນ (ເພີ່ມຂຶ້ນທຸກຄັ້ງທີ່ຕ້ອງການໂຫຼດໃໝ່)
}) => {
  const layersRef = useRef({}); // useRef ເກັບ object ຂອງ layer ແຕ່ລະເມືອງ
  const clickKeyRef = useRef(null); // useRef ເກັບ key ຂອງ click event listener

  const getParcelStyle = (feature, resolution) => {
    // function ສຳລັບກຳນົດ style ຂອງແປງທີ່ດິນ
    const color = feature.get("color") || "#3399CC"; // ດຶງສີຈາກ feature properties, ຖ້າບໍ່ມີໃຊ້ສີຟ້າ
    const isSelected = feature.get("isSelected"); // ກວດສອບວ່າ feature ຖືກເລືອກຢູ່ບໍ່
    const styles = [
      new Style({
        stroke: new Stroke({
          color: isSelected ? "yellow" : "rgba(0, 0, 0, 0.7)", // ສີຂອບ: ເຫຼືອງຖ້າຖືກເລືອກ, ດໍາໂປ່ງໃສຖ້າບໍ່
          width: isSelected ? 3 : 1, // ຄວາມໜາຂອບ: 3 ຖ້າຖືກເລືອກ, 1 ຖ້າບໍ່
        }),
        fill: new Fill({
          color: isSelected ? "rgba(255, 255, 0, 0.6)" : color + "D0", // ສີພື້ນ: ເຫຼືອງໂປ່ງໃສຖ້າຖືກເລືອກ, ສີຕາມ district ຖ້າບໍ່
        }),
      }),
    ];
    if (resolution < 5) {
      // ຖ້າ resolution ຕ່ຳກວ່າ 5 (ໝາຍເຖິງ zoom ເຂົ້າໄປໃກ້ພໍ)
      styles.push(
        new Style({
          text: new Text({
            text: feature.get("parcelno")?.trim() || "", // ສະແດງເລກແປງ
            font: "12px Calibri,sans-serif", // font style
            fill: new Fill({ color: "#000" }), // ສີ text ເປັນສີດໍາ
            stroke: new Stroke({ color: "#fff", width: 3 }), // ເສັ້ນຂອບ text ສີຂາວ
          }),
        })
      );
    }
    return styles; // ສົ່ງຄືນ array ຂອງ styles
  };

  const loadParcelData = useCallback(
    // useCallback ເພື່ອປ້ອງກັນບໍ່ໃຫ້ loadParcelData ຖືກສ້າງໃໝ່ທຸກຄັ້ງທີ່ component re-render
    async (districtToLoad) => {
      // ຮັບ object ຂອງເມືອງທີ່ຈະໂຫຼດ
      setDistricts((prev) =>
        // update state ຂອງ districts
        prev.map((d) =>
          d.name === districtToLoad.name
            ? { ...d, loading: true, error: null } // ຕັ້ງຄ່າ loading ເປັນ true ແລະລ້າງ error
            : d
        )
      );

      try {
        const response = await fetch(districtToLoad.endpoint); // fetch ຂໍ້ມູນຈາກ endpoint ຂອງເມືອງ
        if (!response.ok)
          // ຖ້າ response ບໍ່ສຳເລັດ
          throw new Error(`HTTP error! status: ${response.status}`); // ຖິ້ມ error
        const rawData = await response.json(); // ປ່ຽນ response ເປັນ JSON
        const parcelsArray = rawData[districtToLoad.dataKey]; // ເຂົ້າເຖິງ array ຂອງ parcels ໂດຍໃຊ້ dataKey
        if (!Array.isArray(parcelsArray))
          // ກວດສອບວ່າເປັນ array
          throw new Error("Invalid data format."); // ຖິ້ມ error ຖ້າ format ບໍ່ຖືກຕ້ອງ

        const features = new GeoJSON().readFeatures(
          // ອ່ານ features ຈາກຂໍ້ມູນ GeoJSON
          {
            type: "FeatureCollection",
            features: parcelsArray.map((item) => ({
              type: "Feature",
              geometry: item.geom, // ໃຊ້ key geometry ທີ່ຖືກຕ້ອງ
              id:
                item.cadastre_parcel_id ||
                `${item.cadastremapno}-${item.parcelno}` ||
                `parcel-${item.gid}`, // ຕັ້ງ ID ທີ່ເປັນເອກະລັກໃຫ້ແຕ່ລະ feature
              properties: {
                ...item,
                geom: undefined, // ສ້າງ properties, ຍົກເວັ້ນ geom
                district_lao: item.district_lao || districtToLoad.displayName, // ເພີ່ມຊື່ເມືອງລາວ
                color: districtToLoad.color, // ເພີ່ມສີຂອງເມືອງ
              },
            })),
          },
          { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" } // ກໍານົດ projection
        );

        if (layersRef.current[districtToLoad.name]) {
          // ຖ້າມີ layer ນີ້ຢູ່ແລ້ວ
          map.removeLayer(layersRef.current[districtToLoad.name]); // ລຶບ layer ເກົ່າອອກ
        }

        const newLayer = new VectorLayer({
          // ສ້າງ VectorLayer ໃໝ່
          source: new VectorSource({ features }), // ໃຊ້ source ທີ່ມີ features
          style: getParcelStyle, // ໃຊ້ style ທີ່ກຳນົດໄວ້
          properties: { name: `parcel_layer_${districtToLoad.name}` }, // ກຳນົດ properties ຂອງ layer
          zIndex: 10, // ກຳນົດ zIndex ໃຫ້ສູງກວ່າ layer ອື່ນໆ
          opacity: districtToLoad.opacity, // ຕັ້ງຄ່າຄວາມໂປ່ງໃສເລີ່ມຕົ້ນ
        });
        map.addLayer(newLayer); // ເພີ່ມ layer ເຂົ້າໄປໃນແຜນທີ່
        layersRef.current[districtToLoad.name] = newLayer; // ເກັບ reference ຂອງ layer ໃໝ່

        setDistricts((prev) =>
          // update state ຂອງ districts
          prev.map((d) =>
            d.name === districtToLoad.name
              ? { ...d, loading: false, hasLoaded: true } // ຕັ້ງຄ່າ loading ເປັນ false ແລະ hasLoaded ເປັນ true
              : d
          )
        );
      } catch (error) {
        // ຈັດການກັບ error
        console.error(
          `Error loading data for ${districtToLoad.displayName}:`,
          error
        ); // ສະແດງ error
        setDistricts((prev) =>
          // update state ຂອງ districts ດ້ວຍ error message
          prev.map((d) =>
            d.name === districtToLoad.name
              ? { ...d, loading: false, error: error.message }
              : d
          )
        );
      }
    },
    [map, setDistricts]
  ); // Dependencies ສຳລັບ useCallback

  useEffect(() => {
    // useEffect ນີ້ຈະເຮັດວຽກເມື່ອ loadTrigger ຫຼື districts ປ່ຽນແປງ
    if (loadTrigger > 0) {
      // ຖ້າ loadTrigger ຖືກ trigger
      districts.forEach((district) => {
        // loop ຜ່ານແຕ່ລະເມືອງ
        if (district.checked && !district.hasLoaded && !district.loading) {
          // ຖ້າເມືອງຖືກເລືອກ, ຍັງບໍ່ໄດ້ໂຫຼດ ແລະບໍ່ໄດ້ກຳລັງໂຫຼດ
          loadParcelData(district); // ໂຫຼດຂໍ້ມູນແປງທີ່ດິນສຳລັບເມືອງນັ້ນ
        }
      });
    }
  }, [loadTrigger, districts, loadParcelData]);

  useEffect(() => {
    // useEffect ນີ້ຈະເຮັດວຽກເມື່ອ districts ປ່ຽນແປງ (ສຳລັບການເປີດ/ປິດ ແລະປັບ opacity)
    districts.forEach((district) => {
      // loop ຜ່ານແຕ່ລະເມືອງ
      const layer = layersRef.current[district.name]; // ດຶງ layer ຂອງເມືອງນັ້ນ
      if (layer) {
        // ຖ້າມີ layer
        layer.setVisible(district.checked); // ຕັ້ງຄ່າການເບິ່ງເຫັນຕາມ district.checked
        layer.setOpacity(district.opacity); // ອັບເດດ opacity ຂອງ layer
      }
    });
  }, [districts]);

  useEffect(() => {
    // useEffect ນີ້ຈະເຮັດວຽກເມື່ອ map ຫຼື onParcelSelect ປ່ຽນແປງ (ສຳລັບການຈັດການ click event)
    if (!map) return; // ຖ້າບໍ່ມີ map, ບໍ່ຕ້ອງເຮັດຫຍັງ
    const clickHandler = map.on("singleclick", (evt) => {
      // ຟັງ event singleclick ໃນແຜນທີ່
      Object.values(layersRef.current).forEach((layer) =>
        // loop ຜ່ານທຸກ layer
        layer
          .getSource()
          .getFeatures()
          .forEach((f) => f.get("isSelected") && f.set("isSelected", false))
      ); // ລ້າງ selection ເກົ່າຂອງທຸກ feature
      let selectedFeature = null; // ຕົວແປເກັບ feature ທີ່ຖືກເລືອກ
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // ຫາ feature ທີ່ pixel ທີ່ຄລິກ
        if (layer?.get("name")?.startsWith("parcel_layer_")) {
          // ຖ້າ layer ເປັນ layer ແປງທີ່ດິນ
          selectedFeature = feature; // ກໍານົດ feature ທີ່ຖືກເລືອກ
          return true; // ຢຸດການຊອກຫາ feature
        }
      });
      if (selectedFeature) {
        // ຖ້າມີ feature ຖືກເລືອກ
        selectedFeature.set("isSelected", true); // ຕັ້ງຄ່າ isSelected ເປັນ true
        onParcelSelect(selectedFeature.getProperties()); // ເອີ້ນ onParcelSelect ດ້ວຍ properties ຂອງ feature ນັ້ນ
      } else {
        onParcelSelect(null); // ຖ້າບໍ່ມີ feature ຖືກເລືອກ, ສົ່ງ null
      }
    });
    clickKeyRef.current = clickHandler; // ເກັບ key ຂອງ click handler
    return () => unByKey(clickKeyRef.current); // cleanup: ລຶບ event listener ເມື່ອ component unmount
  }, [map, onParcelSelect]); // Dependencies ສຳລັບ useEffect

  return null; // component ນີ້ບໍ່ໄດ້ render ອົງປະກອບ UI ໃດໆ
};

export default ParcelLayerControl; // export ParcelLayerControl component
