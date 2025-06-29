import React, { useEffect, useRef, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style, Text } from "ol/style";
import { unByKey } from "ol/Observable";
import { Feature } from "ol";

const getParcelStyle = (feature, resolution) => {
  const color = feature.get("color") || "#3399CC";
  const isSelected = feature.get("isSelected");

  const styles = [
    new Style({
      stroke: new Stroke({
        color: isSelected ? "yellow" : "rgba(0, 0, 0, 0.7)",
        width: isSelected ? 3 : 1,
      }),
      fill: new Fill({
        color: isSelected ? "rgba(255, 255, 0, 0.6)" : color + "D0",
      }),
    }),
  ];

  if (resolution < 5) {
    styles.push(
      new Style({
        text: new Text({
          text: feature.get("parcelno") ? feature.get("parcelno").trim() : "",
          font: "12px Calibri,sans-serif",
          fill: new Fill({ color: "#000" }),
          stroke: new Stroke({ color: "#fff", width: 3 }),
        }),
      })
    );
  }
  return styles;
};

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;

const ParcelLayerControl = ({
  map,
  districts,
  setDistricts,
  onParcelSelect,
  loadTrigger, // Prop ໃໝ່ເພື່ອຮັບຄໍາສັ່ງໃຫ້ໂຫຼດ
}) => {
  const layersRef = useRef({});
  const clickKeyRef = useRef(null);

  const loadParcelData = useCallback(
    async (districtToLoad, attempt = 0) => {
      // ... Logic ການໂຫຼດຂໍ້ມູນຍັງຄືເກົ່າ ...
      console.log(
        `[ParcelLayerControl] Starting data load for: ${
          districtToLoad.displayName
        } (Attempt ${attempt + 1}/${MAX_RETRIES + 1})`
      );
      setDistricts((prev) =>
        prev.map((d) =>
          d.name === districtToLoad.name
            ? { ...d, loading: true, error: null }
            : d
        )
      );
      try {
        const response = await fetch(districtToLoad.endpoint);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const rawData = await response.json();
        const parcelsArray = rawData[districtToLoad.dataKey];
        if (!parcelsArray || !Array.isArray(parcelsArray))
          throw new Error(
            `Invalid data format: '${districtToLoad.dataKey}' array not found.`
          );

        const geoJsonFormat = new GeoJSON();
        const features = parcelsArray
          .map((item) => {
            const geoJsonFeature = {
              type: "Feature",
              geometry: item.geom,
              properties: {
                ...item,
                geom: undefined,
                district_lao: item.district_lao || districtToLoad.displayName,
                color: districtToLoad.color,
              },
            };
            return geoJsonFormat.readFeature(geoJsonFeature, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });
          })
          .filter(Boolean);

        let vectorSource =
          layersRef.current[districtToLoad.name]?.getSource() ||
          new VectorSource();
        vectorSource.clear();
        vectorSource.addFeatures(features);

        let layer = layersRef.current[districtToLoad.name];
        if (!layer) {
          layer = new VectorLayer({
            source: vectorSource,
            style: getParcelStyle,
            properties: {
              name: `parcel_layer_${districtToLoad.name}`,
              district: districtToLoad.name,
            },
            zIndex: 10,
          });
          map.addLayer(layer);
          layersRef.current[districtToLoad.name] = layer;
        } else {
          layer.setSource(vectorSource);
        }

        setDistricts((prev) =>
          prev.map((d) =>
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
          `[ParcelLayerControl] Finished loading for ${districtToLoad.displayName}.`
        );
      } catch (error) {
        console.error(
          `[ParcelLayerControl] Error loading for ${districtToLoad.displayName}:`,
          error
        );
        if (attempt < MAX_RETRIES) {
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
          setDistricts((prev) =>
            prev.map((d) =>
              d.name === districtToLoad.name
                ? {
                    ...d,
                    loading: false,
                    error: `${error.message}. Retrying...`,
                  }
                : d
            )
          );
          setTimeout(() => loadParcelData(districtToLoad, attempt + 1), delay);
        } else {
          setDistricts((prev) =>
            prev.map((d) =>
              d.name === districtToLoad.name
                ? { ...d, error: `Failed: ${error.message}`, loading: false }
                : d
            )
          );
        }
      }
    },
    [map, setDistricts]
  );

  // --- NEW EFFECT FOR ON-DEMAND LOADING ---
  // Effect ນີ້ຈະເຮັດວຽກເມື່ອ `loadTrigger` ມີການປ່ຽນແປງເທົ່ານັ້ນ
  useEffect(() => {
    // ບໍ່ໃຫ້ເຮັດວຽກຕອນເລີ່ມຕົ້ນ (ເມື່ອ loadTrigger ເປັນ 0)
    if (loadTrigger > 0) {
      console.log(
        "[ParcelLayerControl] Load trigger received. Loading checked districts."
      );
      districts.forEach((district) => {
        // ໂຫຼດສະເພາະເມືອງທີ່ຖືກເລືອກ (checked) ແລະ ຍັງບໍ່ເຄີຍໂຫຼດ
        if (district.checked && !district.hasLoaded && !district.loading) {
          loadParcelData(district);
        }
      });
    }
  }, [loadTrigger, districts, loadParcelData]);

  // --- EFFECT FOR VISIBILITY MANAGEMENT ---
  // Effect ນີ້ຈະຈັດການສະແດງ/ເຊື່ອງ layer ທີ່ໂຫຼດແລ້ວ
  useEffect(() => {
    districts.forEach((district) => {
      const layer = layersRef.current[district.name];
      if (layer) {
        // ສະແດງ layer ຖ້າຖືກເລືອກ (checked) ແລະ ໂຫຼດຂໍ້ມູນສຳເລັດແລ້ວ
        layer.setVisible(district.checked && district.hasLoaded);
      }
    });
  }, [districts]);

  // Effect ສໍາລັບການຕັ້ງຄ່າ click handler ແລະ cleanup (ຄືເກົ່າ)
  useEffect(() => {
    if (!map) return;

    const clickHandler = map.on("singleclick", (evt) => {
      let selectedFeature = null;
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (layer && layer.get("name")?.startsWith("parcel_layer_")) {
          selectedFeature = feature;
          return true;
        }
      });

      Object.values(layersRef.current).forEach((layer) => {
        layer
          ?.getSource()
          .getFeatures()
          .forEach((f) => f.get("isSelected") && f.set("isSelected", false));
      });

      if (selectedFeature) {
        selectedFeature.set("isSelected", true);
        onParcelSelect(selectedFeature.getProperties());
      } else {
        onParcelSelect(null);
      }
    });

    clickKeyRef.current = clickHandler;

    return () => {
      if (clickKeyRef.current) {
        unByKey(clickKeyRef.current);
      }
      Object.values(layersRef.current).forEach((layer) =>
        map.removeLayer(layer)
      );
      layersRef.current = {};
    };
  }, [map, onParcelSelect]);

  return null;
};

export default ParcelLayerControl;
