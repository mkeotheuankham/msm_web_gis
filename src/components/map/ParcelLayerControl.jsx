import React, { useEffect, useRef, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style, Text } from "ol/style";
import { unByKey } from "ol/Observable";

const ParcelLayerControl = ({
  map,
  districts, // Note: This will be the filtered list of *checked* districts from App.jsx
  setDistricts,
  onParcelSelect,
  loadTrigger,
}) => {
  const layersRef = useRef({});
  const clickKeyRef = useRef(null);

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
            text: feature.get("parcelno")?.trim() || "",
            font: "12px Calibri,sans-serif",
            fill: new Fill({ color: "#000" }),
            stroke: new Stroke({ color: "#fff", width: 3 }),
          }),
        })
      );
    }
    return styles;
  };

  const loadParcelData = useCallback(
    async (districtToLoad) => {
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
        if (!Array.isArray(parcelsArray))
          throw new Error("Invalid data format.");

        const features = new GeoJSON().readFeatures(
          {
            type: "FeatureCollection",
            features: parcelsArray.map((item) => ({
              type: "Feature",
              geometry: item.geom,
              id:
                item.cadastre_parcel_id ||
                `${item.cadastremapno}-${item.parcelno}` ||
                `parcel-${item.gid}`,
              properties: {
                ...item,
                geom: undefined,
                district_lao: item.district_lao || districtToLoad.displayName,
                color: districtToLoad.color,
              },
            })),
          },
          { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }
        );

        if (layersRef.current[districtToLoad.name]) {
          map.removeLayer(layersRef.current[districtToLoad.name]);
        }

        const newLayer = new VectorLayer({
          source: new VectorSource({ features }),
          style: getParcelStyle,
          properties: { name: `parcel_layer_${districtToLoad.name}` },
          zIndex: 10,
          opacity: districtToLoad.opacity, // Set initial opacity
        });
        map.addLayer(newLayer);
        layersRef.current[districtToLoad.name] = newLayer;

        setDistricts((prev) =>
          prev.map((d) =>
            d.name === districtToLoad.name
              ? { ...d, loading: false, hasLoaded: true }
              : d
          )
        );
      } catch (error) {
        console.error(
          `Error loading data for ${districtToLoad.displayName}:`,
          error
        );
        setDistricts((prev) =>
          prev.map((d) =>
            d.name === districtToLoad.name
              ? { ...d, loading: false, error: error.message }
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
        layer.setVisible(district.checked);
        layer.setOpacity(district.opacity); // Update opacity
      }
    });
  }, [districts]);

  useEffect(() => {
    if (!map) return;
    const clickHandler = map.on("singleclick", (evt) => {
      Object.values(layersRef.current).forEach((layer) =>
        layer
          .getSource()
          .getFeatures()
          .forEach((f) => f.get("isSelected") && f.set("isSelected", false))
      );
      let selectedFeature = null;
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (layer?.get("name")?.startsWith("parcel_layer_")) {
          selectedFeature = feature;
          return true;
        }
      });
      if (selectedFeature) {
        selectedFeature.set("isSelected", true);
        onParcelSelect(selectedFeature.getProperties());
      } else {
        onParcelSelect(null);
      }
    });
    clickKeyRef.current = clickHandler;
    return () => unByKey(clickKeyRef.current);
  }, [map, onParcelSelect]);

  return null;
};

export default ParcelLayerControl;
