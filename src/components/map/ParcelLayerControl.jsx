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
  const color = feature.get("color") || "#3399CC"; // ໃຊ້ color ຈາກ feature ຫຼື default
  const isSelected = feature.get("isSelected");

  const styles = [
    new Style({
      stroke: new Stroke({
        color: isSelected ? "yellow" : "rgba(0, 0, 0, 0.7)", // ສີຂອບຂອງ parcel
        width: isSelected ? 3 : 1, // ຄວາມຫນາຂອງຂອບ
      }),
      fill: new Fill({
        color: isSelected ? "rgba(255, 255, 0, 0.6)" : color + "D0", // ປັບຄວາມໂປ່ງໃສ (D0 = 80% opacity)
      }),
    }),
  ];

  // ສະແດງຊື່ parcelno ຖ້າ zoom ເຂົ້າໄປໃກ້ພໍ
  if (resolution < 5) {
    // ປັບຄ່າ resolution
    styles.push(
      new Style({
        text: new Text({
          text: feature.get("parcelno") ? feature.get("parcelno").trim() : "",
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

  // loadParcelData: ດຶງຂໍ້ມູນ ແລະເພີ່ມ layer ເຂົ້າແຜນທີ່
  const loadParcelData = useCallback(
    async (districtToLoad) => {
      console.log(
        `[ParcelLayerControl] Starting data load for: ${districtToLoad.displayName}`
      );
      // 1. ອັບເດດສະຖານະເມືອງ: ຕັ້ງ loading ເປັນ true
      setDistricts((prevDistricts) =>
        prevDistricts.map((d) =>
          d.name === districtToLoad.name
            ? { ...d, loading: true, error: null }
            : d
        )
      );

      try {
        const url = districtToLoad.endpoint;

        console.log(`[ParcelLayerControl] Fetching data from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
          // ຖ້າ response ບໍ່ OK, ໃຫ້ສະແດງ statusText ດ້ວຍ
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`
          );
        }

        const rawData = await response.json();
        console.log(
          `[ParcelLayerControl] API Raw Data for ${districtToLoad.name}:`,
          rawData
        );

        const parcelsArray = rawData[districtToLoad.dataKey];

        if (!parcelsArray || !Array.isArray(parcelsArray)) {
          throw new Error(
            `Invalid data format: '${districtToLoad.dataKey}' array not found or invalid.`
          );
        }

        const features = [];
        const geoJsonFormat = new GeoJSON();

        parcelsArray.forEach((item) => {
          if (item.geom && item.geom.coordinates) {
            const geoJsonFeature = {
              type: "Feature",
              geometry: item.geom,
              properties: {
                ...item,
                geom: undefined, // ລຶບ geom ຈາກ properties
                centroid_coordinates: undefined, // ລຶບ centroid_coordinates ຈາກ properties
                district_lao: item.district_lao || districtToLoad.displayName,
                color: districtToLoad.color,
                cadastre_parcel_id:
                  item.cadastre_parcel_id ||
                  (item.cadastremapno && item.parcelno
                    ? `${item.cadastremapno}-${item.parcelno}`
                    : undefined),
              },
            };
            try {
              const olFeature = geoJsonFormat.readFeature(geoJsonFeature, {
                dataProjection: "EPSG:4326", // WGS84
                featureProjection: "EPSG:3857", // Web Mercator
              });
              features.push(olFeature);
            } catch (geojsonError) {
              console.error(
                `[ParcelLayerControl] Failed to read GeoJSON feature for ${
                  districtToLoad.displayName
                } at parcelno ${item.parcelno || "N/A"}:`,
                geoJsonFeature,
                geojsonError
              );
            }
          } else {
            console.warn(
              `[ParcelLayerControl] Skipping malformed or incomplete item for ${
                districtToLoad.displayName
              } (gid: ${item.gid || "N/A"}):`,
              item
            );
          }
        });

        console.log(
          `[ParcelLayerControl] ${features.length} features parsed for ${districtToLoad.displayName}.`
        );

        let vectorSource = layersRef.current[districtToLoad.name]?.getSource();
        if (!vectorSource) {
          vectorSource = new VectorSource();
        }
        vectorSource.clear(); // Clear existing features
        vectorSource.addFeatures(features); // Add new features

        let layer = layersRef.current[districtToLoad.name];
        if (!layer) {
          layer = new VectorLayer({
            source: vectorSource,
            style: getParcelStyle,
            properties: {
              name: `parcel_layer_${districtToLoad.name}`,
              district: districtToLoad.name,
            },
            zIndex: 10, // Ensure parcel layers are above base maps
          });
          map.addLayer(layer);
          console.log(
            `[ParcelLayerControl] Added new OpenLayers layer for ${districtToLoad.displayName} to map.`
          );
        } else {
          layer.setSource(vectorSource); // Update source for existing layer
          console.log(
            `[ParcelLayerControl] Updated source for existing layer of ${districtToLoad.displayName}.`
          );
        }

        layersRef.current[districtToLoad.name] = layer;

        // 2. ອັບເດດສະຖານະເມືອງ: ຕັ້ງ loading ເປັນ false, hasLoaded ເປັນ true
        setDistricts((prevDistricts) =>
          prevDistricts.map((d) =>
            d.name === districtToLoad.name
              ? {
                  ...d,
                  parcels: features,
                  loading: false,
                  hasLoaded: true,
                  error: null,
                }
              : d
          )
        );

        console.log(
          `[ParcelLayerControl] Finished loading and adding layer for ${districtToLoad.displayName}.`
        );
      } catch (error) {
        console.error(
          `[ParcelLayerControl] Error loading parcel data for ${districtToLoad.displayName}:`,
          error
        );
        // ຕັ້ງຄ່າ error ໃຫ້ສະແດງໃນ DistrictSelector
        setDistricts((prevDistricts) =>
          prevDistricts.map((d) =>
            d.name === districtToLoad.name
              ? {
                  ...d,
                  error: error.message,
                  loading: false,
                  hasLoaded: false,
                  parcels: [],
                } // Clear parcels on error
              : d
          )
        );
      }
    },
    [map, setDistricts]
  );

  // ຕັ້ງຄ່າ map click handler ສໍາລັບການເລືອກ parcel
  const setupClickHandler = useCallback(() => {
    if (!map) return;

    if (clickKeyRef.current) {
      unByKey(clickKeyRef.current);
      console.log("[ParcelLayerControl] Removed previous click listener.");
    }

    clickKeyRef.current = map.on("singleclick", async (evt) => {
      let selectedParcelFeature = null;

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (
          layer &&
          layer.get("name") &&
          layer.get("name").startsWith("parcel_layer_")
        ) {
          if (
            feature.getGeometry() &&
            (feature.get("parcelno") || feature.get("cadastre_parcel_id"))
          ) {
            selectedParcelFeature = feature;
            return true;
          }
        }
      });

      // Clear ສະຖານະການເລືອກກ່ອນໜ້າໃນທຸກ features ທີ່ເຄີຍຖືກເລືອກ
      Object.values(layersRef.current).forEach((layer) => {
        if (layer && layer.getSource()) {
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

      if (selectedParcelFeature) {
        selectedParcelFeature.set("isSelected", true);
        selectedParcelFeature.changed(); // ບັງຄັບໃຫ້ feature update style
        onParcelSelect(selectedParcelFeature.getProperties());
        console.log(
          "[ParcelLayerControl] Parcel selected:",
          selectedParcelFeature.getProperties()
        );
      } else {
        onParcelSelect(null);
        console.log("[ParcelLayerControl] No parcel selected.");
      }
    });
    console.log("[ParcelLayerControl] Click listener setup complete.");
  }, [map, onParcelSelect]);

  // Effect ສໍາລັບການຕັ້ງຄ່າ click handler ເບື້ອງຕົ້ນ ແລະ cleanup
  useEffect(() => {
    if (!map) return;
    setupClickHandler();

    return () => {
      // Cleanup: remove all parcel layers from map on component unmount
      Object.values(layersRef.current).forEach((layer) => {
        if (map && layer) {
          map.removeLayer(layer);
        }
      });
      layersRef.current = {}; // Clear the ref
      if (clickKeyRef.current) {
        unByKey(clickKeyRef.current);
        clickKeyRef.current = null;
      }
      console.log(
        "[ParcelLayerControl] Component unmounted or map changed, cleaned up layers and click listener."
      );
    };
  }, [map, setupClickHandler]);

  // Effect ເພື່ອຈັດການການເພີ່ມ/ລົບ layers ເມື່ອ districts state ປ່ຽນແປງ
  useEffect(() => {
    const process = debounce(() => {
      console.log(
        "[ParcelLayerControl] Running debounced layer management based on district state."
      );
      districts.forEach((district) => {
        let layer = layersRef.current[district.name];

        if (district.checked) {
          if (!district.hasLoaded && !district.loading && district.endpoint) {
            // ເມືອງຖືກເລືອກ, ແຕ່ຍັງບໍ່ໄດ້ໂຫຼດເທື່ອ -> ເລີ່ມການໂຫຼດ
            console.log(
              `[ParcelLayerControl] Initiating load for checked district: ${district.name}`
            );
            loadParcelData(district);
          } else if (district.hasLoaded) {
            // ເມືອງຖືກເລືອກ ແລະໂຫຼດແລ້ວ
            if (layer) {
              // ຖ້າ layer ມີຢູ່, ໃຫ້ແນ່ໃຈວ່າມັນເບິ່ງເຫັນໄດ້
              if (!map.getLayers().getArray().includes(layer)) {
                // ຖ້າ layer ຖືກເອົາອອກຈາກແຜນທີ່ ແຕ່ຍັງຢູ່ໃນ ref, ໃຫ້ເພີ່ມຄືນ
                map.addLayer(layer);
              }
              layer.setVisible(true);
              console.log(
                `[ParcelLayerControl] Ensuring layer for ${district.name} is visible.`
              );
            } else {
              // ຖ້າ hasLoaded ເປັນ true ແຕ່ layer ບໍ່ຢູ່ໃນ ref (ບໍ່ຄວນເກີດຂຶ້ນ), ໃຫ້ສ້າງ layer ຄືນໃໝ່
              console.warn(
                `[ParcelLayerControl] Layer not found in ref for loaded district ${district.name}, attempting to re-render.`
              );
              if (district.parcels && district.parcels.length > 0) {
                const vectorSource = new VectorSource({
                  features: district.parcels,
                });
                layer = new VectorLayer({
                  source: vectorSource,
                  style: getParcelStyle,
                  properties: {
                    name: `parcel_layer_${district.name}`,
                    district: district.name,
                  },
                  zIndex: 10,
                });
                map.addLayer(layer);
                layer.setVisible(true);
                layersRef.current[district.name] = layer;
                console.log(
                  `[ParcelLayerControl] Recreated and added layer for ${district.name}.`
                );
              } else {
                console.error(
                  `[ParcelLayerControl] hasLoaded is true for ${district.name} but no parcels data available to recreate layer.`
                );
                // ທາງເລືອກ: ຕັ້ງ hasLoaded ເປັນ false ບ່ອນນີ້ເພື່ອບັງຄັບໃຫ້ໂຫຼດຄືນໃໝ່ໃນການກົດຕໍ່ໄປ ຖ້າຂໍ້ມູນຫາຍໄປແທ້ໆ
                setDistricts((prev) =>
                  prev.map((d) =>
                    d.name === district.name
                      ? { ...d, hasLoaded: false, parcels: [] }
                      : d
                  )
                );
              }
            }
          }
        } else {
          // ເມືອງບໍ່ໄດ້ຖືກເລືອກ
          if (layer) {
            // ຖ້າ layer ມີຢູ່, ພຽງແຕ່ເຊື່ອງມັນ
            layer.setVisible(false);
            console.log(
              `[ParcelLayerControl] Hiding layer for unchecked district: ${district.name}.`
            );
            // ບໍ່ຕ້ອງລຶບອອກຈາກແຜນທີ່ ຫຼື layersRef.current
            // ບໍ່ຕ້ອງ reset hasLoaded ຫຼື parcels
          }
        }
      });
    }, 150); // Debounce ສັ້ນໆ ເພື່ອລວມການຄລິກ checkbox ທີ່ໄວ

    process();
  }, [districts, map, loadParcelData, setDistricts]); // Dependencies ສໍາລັບ useEffect ນີ້

  // render ຟັງຊັນເຫຼົ່ານີ້ຖືກປິດການໃຊ້ງານແລ້ວໃນ MapComponent
  return null;
};

export default ParcelLayerControl;
