import React, { useEffect, useRef, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style, Text } from "ol/style";
import { unByKey } from "ol/Observable";

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
  loadTrigger,
}) => {
  const layersRef = useRef({});
  const clickKeyRef = useRef(null);

  const loadParcelData = useCallback(
    async (districtToLoad, attempt = 0) => {
      console.log(
        `[ParcelLayerControl] Loading: ${districtToLoad.displayName} (Attempt ${
          attempt + 1
        })`
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
          throw new Error(`Invalid data format.`);

        const geoJsonFormat = new GeoJSON();
        const features = [];
        parcelsArray.forEach((item) => {
          if (!item.geom) return;

          const olFeature = geoJsonFormat.readFeature(
            {
              type: "Feature",
              geometry: item.geom,
              properties: {
                ...item,
                geom: undefined,
                district_lao: item.district_lao || districtToLoad.displayName,
                color: districtToLoad.color,
              },
            },
            { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }
          );

          // --- FIX: Set a unique ID for each feature ---
          const featureId =
            item.cadastre_parcel_id ||
            `${item.cadastremapno}-${item.parcelno}` ||
            `parcel-${item.gid}`;
          olFeature.setId(featureId);

          features.push(olFeature);
        });

        let vectorSource =
          layersRef.current[districtToLoad.name]?.getSource() ||
          new VectorSource();
        vectorSource.clear();
        vectorSource.addFeatures(features);

        if (!layersRef.current[districtToLoad.name]) {
          const newLayer = new VectorLayer({
            source: vectorSource,
            style: getParcelStyle,
            properties: {
              name: `parcel_layer_${districtToLoad.name}`,
              district: districtToLoad.name,
            },
            zIndex: 10,
          });
          map.addLayer(newLayer);
          layersRef.current[districtToLoad.name] = newLayer;
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
      } catch (error) {
        console.error(
          `[ParcelLayerControl] Error for ${districtToLoad.displayName}:`,
          error
        );
        setDistricts((prev) =>
          prev.map((d) =>
            d.name === districtToLoad.name
              ? { ...d, error: `Failed: ${error.message}`, loading: false }
              : d
          )
        );
      }
    },
    [map, setDistricts]
  );

  useEffect(() => {
    if (loadTrigger > 0) {
      districts.forEach((district) => {
        if (district.checked && !district.hasLoaded && !district.loading) {
          loadParcelData(district);
        }
      });
    }
  }, [loadTrigger, districts, loadParcelData]);

  useEffect(() => {
    districts.forEach((district) => {
      const layer = layersRef.current[district.name];
      if (layer) {
        layer.setVisible(district.checked && district.hasLoaded);
      }
    });
  }, [districts]);

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
      if (clickKeyRef.current) unByKey(clickKeyRef.current);
      Object.values(layersRef.current).forEach((layer) =>
        map.removeLayer(layer)
      );
      layersRef.current = {};
    };
  }, [map, onParcelSelect]);

  return null;
};
export default ParcelLayerControl;
