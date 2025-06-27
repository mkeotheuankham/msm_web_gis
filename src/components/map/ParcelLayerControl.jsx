import React, { useEffect, useRef, useCallback, useState } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style, Text } from "ol/style";
import { unByKey } from "ol/Observable";
import { Feature } from "ol"; // ນໍາເຂົ້າ Feature ເພື່ອສ້າງ feature ໃຫມ່

// ຟັງຊັນ debounce ສຳລັບຈຳກັດການເຮັດວຽກທີ່ຖີ່ຖ້ວນ
const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

// Style ສໍາລັບ Parcel Layer
const getParcelStyle = (feature, resolution) => {
  const districtName = feature.get("district_lao"); // ປ່ຽນເປັນຊື່ field ທີ່ຖືກຕ້ອງຈາກ GeoJSON properties
  const color = feature.get("color") || "#3399CC"; // ໃຊ້ color ຈາກ feature ຫຼື default
  const isSelected = feature.get("isSelected");

  const styles = [
    new Style({
      stroke: new Stroke({
        color: isSelected ? "yellow" : "rgba(0, 0, 0, 0.7)", // ສີຂອບຂອງ parcel
        width: isSelected ? 3 : 1, // ຄວາມຫນາຂອງຂອບ
      }),
      fill: new Fill({
        color: isSelected ? "rgba(255, 255, 0, 0.4)" : color + "B0", // ສີພື້ນຂອງ parcel (B0 ຄື transparency)
      }),
    }),
  ];

  // ສະແດງຊື່ parcelno ຖ້າ zoom ເຂົ້າໄປໃກ້ພໍ
  // ປັບຄ່າ resolution ໃຫ້ສະແດງຂໍ້ຄວາມສະເພາະເມື່ອຊູມໃກ້ຫຼາຍຂຶ້ນ ເພື່ອປະສິດທິພາບ
  if (resolution < 5) {
    // ປັບຄ່າຈາກ 50 ເປັນ 5
    styles.push(
      new Style({
        text: new Text({
          text: feature.get("parcelno") ? feature.get("parcelno").trim() : "", // ໃຊ້ .trim() ເພື່ອເອົາຊ່ອງວ່າງອອກ
          font: "12px Calibri,sans-serif",
          fill: new Fill({ color: "#000" }),
          stroke: new Stroke({
            color: "#fff",
            width: 3,
          }),
        }),
      })
    );
  }

  return styles;
};

const ParcelLayerControl = ({
  map,
  districts,
  setDistricts,
  onParcelSelect,
}) => {
  const layersRef = useRef({});
  const clickKeyRef = useRef(null);
  const [loadingDistricts, setLoadingDistricts] = useState([]);
  const [errors, setErrors] = useState({});

  const loadParcelData = useCallback(
    async (district) => {
      try {
        setLoadingDistricts((prev) => [...prev, district.displayName]); // ໃຊ້ displayName ສໍາລັບການສະແດງຜົນ
        setErrors((prev) => ({ ...prev, [district.name]: null })); // ເຄລຍ error ເມື່ອເລີ່ມໂຫຼດ

        const url = district.endpoint;

        console.log(`Fetching data from: ${url}`); // ເພີ່ມ logging ເພື່ອເບິ່ງ URL

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log(`API Raw Data for ${district.name}:`, rawData); // ເພີ່ມ logging ເພື່ອເບິ່ງໂຄງສ້າງຂໍ້ມູນດິບ

        // ກວດສອບໂຄງສ້າງຂໍ້ມູນ ແລະດຶງ array ຂອງ parcels ອອກມາໂດຍໃຊ້ district.dataKey
        const parcelsArray = rawData[district.dataKey];

        if (!parcelsArray || !Array.isArray(parcelsArray)) {
          throw new Error(
            `Invalid data format: '${district.dataKey}' array not found or invalid.`
          );
        }

        const features = [];
        const geoJsonFormat = new GeoJSON(); // ສ້າງ GeoJSON formatter ຄັ້ງດຽວ

        parcelsArray.forEach((item) => {
          if (item.geom && item.geom.coordinates) {
            // ສ້າງ GeoJSON Feature object ຕາມມາດຕະຖານ
            const geoJsonFeature = {
              type: "Feature",
              geometry: item.geom, // ໃຊ້ item.geom ໂດຍກົງ ເພາະມັນເປັນ GeoJSON geometry ແລ້ວ
              properties: {
                // ເອົາ properties ທັງໝົດຈາກ item ໂດຍກົງ
                ...item,
                // ລົບ geometry field ອອກຈາກ properties ເພື່ອບໍ່ໃຫ້ຊ້ຳຊ້ອນ
                geom: undefined,
                centroid_coordinates: undefined, // ລົບ centroid_coordinates ອອກຈາກ properties ຖ້າບໍ່ຈຳເປັນ
                // ເພີ່ມຂໍ້ມູນເພີ່ມເຕີມທີ່ຈຳເປັນສຳລັບການສະແດງຜົນ ຫຼື filter ຖ້າບໍ່ມີໃນ API
                district_lao: item.district_lao || district.displayName, // ໃຊ້ district_lao ຈາກ API, ຖ້າບໍ່ມີໃຊ້ displayName
                color: district.color, // ໃຊ້ color ຈາກ district object
              },
            };
            // ໃຊ້ readFeature ເພື່ອປ່ຽນ GeoJSON feature object ໃຫ້ເປັນ OpenLayers Feature
            features.push(
              geoJsonFormat.readFeature(geoJsonFeature, {
                dataProjection: "EPSG:4326", // ຂໍ້ມູນ GeoJSON ຂອງເຈົ້າຢູ່ໃນ WGS84
                featureProjection: "EPSG:3857", // ແຜນທີ່ຂອງ OpenLayers ໃຊ້ Web Mercator
              })
            );
          }
        });

        // ສ້າງ VectorSource ຈາກ features
        const source = new VectorSource({
          features: features,
        });

        // ສ້າງ VectorLayer
        const layer = new VectorLayer({
          source: source,
          style: getParcelStyle, // ໃຊ້ຟັງຊັນ style ທີ່ເຮົາກຳນົດໄວ້
          properties: {
            name: `parcel_layer_${district.name}`,
            district: district.name,
          },
        });

        layersRef.current[district.name] = layer;
        map.addLayer(layer);

        // ອັບເດດສະຖານະການໂຫຼດ
        setLoadingDistricts(
          (prev) => prev.filter((dName) => dName !== district.displayName) // ໃຊ້ displayName
        );
      } catch (error) {
        console.error(
          `Error loading parcel data for ${district.displayName}:`,
          error
        );
        setErrors((prev) => ({ ...prev, [district.name]: error.message }));
        setLoadingDistricts(
          (prev) => prev.filter((dName) => dName !== district.displayName) // ໃຊ້ displayName
        );
      }
    },
    [map] // ປັບ dependencies ໃຫ້ເຫມາະສົມ
  );

  const setupClickHandler = useCallback(() => {
    if (!map) return;

    if (clickKeyRef.current) {
      unByKey(clickKeyRef.current);
    }

    clickKeyRef.current = map.on("singleclick", async (evt) => {
      let selectedParcel = null;
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // ໃຫ້ແນ່ໃຈວ່າຄລິກຖືກ layer ຂອງ parcel ທີ່ເຮົາສົນໃຈ
        if (
          layer &&
          layer.get("name") &&
          layer.get("name").startsWith("parcel_layer_")
        ) {
          selectedParcel = feature;
          return true; // ຢຸດການຊອກຫາເມື່ອພົບ feature ແລ້ວ
        }
      });

      // Clear previous selected state (ລຶບສະຖານະການເລືອກກ່ອນໜ້າ)
      Object.values(layersRef.current).forEach((layer) => {
        if (layer) {
          layer
            .getSource()
            .getFeatures()
            .forEach((f) => {
              if (f.get("isSelected")) {
                f.set("isSelected", false);
                f.changed(); // ບັງຄັບໃຫ້ layer update style
              }
            });
        }
      });

      if (selectedParcel) {
        // ຕັ້ງຄ່າ isSelected ເພື່ອປ່ຽນ style
        selectedParcel.set("isSelected", true);
        selectedParcel.changed(); // ບັງຄັບໃຫ້ feature update style
        onParcelSelect(selectedParcel.getProperties()); // ສົ່ງ properties ຂອງ feature ໄປໃຫ້ ParcelInfoPanel
      } else {
        onParcelSelect(null); // ບໍ່ມີ parcel ຖືກເລືອກ
      }
    });
  }, [map, onParcelSelect]);

  const processDistricts = useCallback(
    debounce(() => {
      districts.forEach((district) => {
        const layerExists = layersRef.current[district.name];

        if (district.checked && !layerExists) {
          // ເລືອກແລ້ວ ແລະຍັງບໍ່ມີ layer, ໃຫ້ໂຫຼດຂໍ້ມູນ
          loadParcelData(district);
        } else if (!district.checked && layerExists) {
          // ບໍ່ເລືອກແລ້ວ ແລະມີ layer, ໃຫ້ເອົາ layer ອອກ
          map.removeLayer(layerExists);
          delete layersRef.current[district.name];
        }
      });
    }, 300),
    [map, districts, loadParcelData] // ບໍ່ຕ້ອງມີ setDistricts ຢູ່ທີ່ນີ້, ມັນເປັນ state setter
  );

  useEffect(() => {
    if (!map) return;

    setupClickHandler();

    return () => {
      // Cleanup
      Object.values(layersRef.current).forEach((layer) => {
        map.removeLayer(layer);
      });
      if (clickKeyRef.current) {
        unByKey(clickKeyRef.current);
      }
    };
  }, [map, setupClickHandler]);

  useEffect(() => {
    processDistricts();
  }, [districts, processDistricts]);

  // ຟັງຊັນສະແດງສະຖານະການໂຫລດ
  const renderLoadingStatus = () => {
    if (loadingDistricts.length === 0) return null;

    return (
      <div className="parcel-loading-status">
        <div className="loading-spinner"></div>
        <p>ກຳລັງໂຫລດຂໍ້ມູນ: {loadingDistricts.join(", ")}</p>
      </div>
    );
  };

  // ຟັງຊັນສະແດງຂໍ້ຜິດພາດ
  const renderErrors = () => {
    const errorEntries = Object.entries(errors).filter(([_, error]) => error);
    if (errorEntries.length === 0) return null;

    return (
      <div className="parcel-errors">
        <p>ມີຂໍ້ຜິດພາດໃນການໂຫລດຂໍ້ມູນ:</p>
        <div className="error-list">
          {errorEntries.map(([districtName, errorMessage]) => (
            <div key={districtName} className="error-item">
              <span className="error-message">
                {districtName}: {errorMessage}
              </span>
              <button
                className="retry-button"
                onClick={() => {
                  const districtToRetry = districts.find(
                    (d) => d.name === districtName
                  );
                  if (districtToRetry) {
                    loadParcelData(districtToRetry);
                  }
                }}
              >
                ລອງໃໝ່
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderLoadingStatus()}
      {renderErrors()}
    </>
  );
};

export default ParcelLayerControl;
