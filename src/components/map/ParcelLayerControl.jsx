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
  if (resolution < 5) {
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

  // loadParcelData is responsible for fetching and processing data for a district
  const loadParcelData = useCallback(
    async (districtToLoad) => {
      // Set loading state for this specific district
      setDistricts((prevDistricts) =>
        prevDistricts.map((d) =>
          d.name === districtToLoad.name
            ? { ...d, loading: true, error: null }
            : d
        )
      );

      try {
        const url = districtToLoad.endpoint;
        console.log(`Fetching data from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();
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
                geom: undefined,
                centroid_coordinates: undefined,
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
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:3857",
              });
              features.push(olFeature);
            } catch (geojsonError) {
              console.error(
                `Failed to read GeoJSON feature for ${
                  districtToLoad.displayName
                } at parcelno ${item.parcelno || "N/A"}:`,
                geoJsonFeature,
                geojsonError
              );
            }
          } else {
            console.warn(
              `Skipping malformed or incomplete item for ${
                districtToLoad.displayName
              } (gid: ${item.gid || "N/A"}):`,
              item
            );
          }
        });

        const source = new VectorSource({ features: features });
        const layer = new VectorLayer({
          source: source,
          style: getParcelStyle,
          properties: {
            name: `parcel_layer_${districtToLoad.name}`,
            district: districtToLoad.name,
          },
          zIndex: 10,
        });

        layersRef.current[districtToLoad.name] = layer;
        map.addLayer(layer);

        console.log(
          `Added ${features.length} parcels for ${districtToLoad.displayName}.`
        );

        // Update district state after successful load
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
      } catch (error) {
        console.error(
          `Error loading parcel data for ${districtToLoad.displayName}:`,
          error
        );
        const errorMessage = error.message.includes("HTTP error!")
          ? `ການເຊື່ອມຕໍ່ API ມີບັນຫາ: ${error.message}`
          : `ຂໍ້ມູນບໍ່ຖືກຕ້ອງ: ${error.message}`;

        // Update district state with error
        setDistricts((prevDistricts) =>
          prevDistricts.map((d) =>
            d.name === districtToLoad.name
              ? { ...d, error: errorMessage, loading: false, hasLoaded: false }
              : d
          )
        );
      }
    },
    [map, setDistricts]
  );

  // Effect to trigger data fetching when a district is checked
  useEffect(() => {
    districts.forEach((district) => {
      // If district is checked, hasn't loaded yet, isn't currently loading, and has an endpoint
      if (
        district.checked &&
        !district.hasLoaded &&
        !district.loading &&
        district.endpoint
      ) {
        loadParcelData(district);
      }
    });
  }, [districts, loadParcelData]);

  // Setup map click handler for parcel selection
  const setupClickHandler = useCallback(() => {
    if (!map) return;

    if (clickKeyRef.current) {
      unByKey(clickKeyRef.current);
    }

    clickKeyRef.current = map.on("singleclick", async (evt) => {
      let selectedParcelFeature = null;

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (
          layer &&
          layer.get("name") &&
          layer.get("name").startsWith("parcel_layer_")
        ) {
          if (feature.getGeometry() && feature.get("cadastre_parcel_id")) {
            selectedParcelFeature = feature;
            return true;
          }
        }
      });

      Object.values(layersRef.current).forEach((layer) => {
        if (layer && layer.getSource()) {
          layer
            .getSource()
            .getFeatures()
            .forEach((f) => {
              if (f.get("isSelected")) {
                f.set("isSelected", false);
                f.changed();
              }
            });
        }
      });

      if (selectedParcelFeature) {
        selectedParcelFeature.set("isSelected", true);
        selectedParcelFeature.changed();
        onParcelSelect(selectedParcelFeature.getProperties());
      } else {
        onParcelSelect(null);
      }
    });
  }, [map, onParcelSelect]);

  // Effect for initial click handler setup and cleanup
  useEffect(() => {
    if (!map) return;
    setupClickHandler();

    return () => {
      // Cleanup: remove all parcel layers and click handler
      Object.values(layersRef.current).forEach((layer) => {
        if (map && layer) {
          map.removeLayer(layer);
        }
      });
      layersRef.current = {};
      if (clickKeyRef.current) {
        unByKey(clickKeyRef.current);
        clickKeyRef.current = null;
      }
    };
  }, [map, setupClickHandler]);

  // Effect to process districts whenever the districts state changes (add/remove layers)
  useEffect(() => {
    const process = debounce(() => {
      districts.forEach((district) => {
        const layerExists = layersRef.current[district.name];

        if (district.checked && !district.loading && !layerExists) {
          // If district is checked, hasn't loaded yet, isn't currently loading, and has an endpoint
          loadParcelData(district); // This will set district.loading = true
        } else if (!district.checked && layerExists) {
          // If district is unchecked and layer exists, remove layer
          map.removeLayer(layerExists);
          delete layersRef.current[district.name];
          // Reset hasLoaded, error, and parcels for this district when unchecked
          setDistricts((prevDistricts) =>
            prevDistricts.map((d) =>
              d.name === district.name
                ? { ...d, hasLoaded: false, error: null, loading: false } // Also reset loading here
                : d
            )
          );
        }
      });
    }, 100); // Debounce to prevent rapid updates

    process();
  }, [districts, map, loadParcelData, setDistricts]);

  // Render loading and error status within this component if needed for specific district feedback
  // (These are now redundant with the DistrictSelector showing individual loading/error states,
  // but kept here as a fallback or for more detailed messages if required)
  const renderLoadingStatus = () => {
    const loadingDistrictsList = districts
      .filter((d) => d.loading)
      .map((d) => d.displayName);
    if (loadingDistrictsList.length === 0) return null;

    return (
      <div className="parcel-loading-status">
        <div className="loading-spinner"></div>
        <p>ກຳລັງໂຫລດຂໍ້ມູນ: {loadingDistrictsList.join(", ")}</p>
      </div>
    );
  };

  const renderErrors = () => {
    const errorDistricts = districts.filter((d) => d.error);
    if (errorDistricts.length === 0) return null;

    return (
      <div className="parcel-error-status">
        <p>ມີຂໍ້ຜິດພາດໃນການໂຫລດຂໍ້ມູນ:</p>
        <div className="error-list">
          {errorDistricts.map((d) => (
            <div key={d.name} className="error-item">
              <span className="error-message">
                {d.displayName}: {d.error}
              </span>
              <button
                className="retry-button"
                onClick={() => {
                  // Reset error and hasLoaded to trigger re-fetch by MapComponent's useEffect
                  setDistricts((prev) =>
                    prev.map((districtItem) =>
                      districtItem.name === d.name
                        ? {
                            ...districtItem,
                            error: null,
                            hasLoaded: false,
                            loading: false,
                          }
                        : districtItem
                    )
                  );
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
      {renderLoadingStatus()}{" "}
      {/* This will now mostly be hidden, global one in MapComponent */}
      {renderErrors()} {/* This will show more detailed errors if any */}
    </>
  );
};

export default ParcelLayerControl;
