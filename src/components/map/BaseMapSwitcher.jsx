// src/components/map/BaseMapSwitcher.jsx (Full Stable Version)

import React, { useEffect, useRef } from "react";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";

const BaseMapSwitcher = ({ map, selectedBaseMap, onSelectBaseMap }) => {
  const currentBaseLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const getSourceUrl = (mapName) => {
      switch (mapName) {
        case "Google Satellite":
          return "https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}";
        case "Google Hybrid":
          return "https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}";
        case "OSM":
        default:
          return "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      }
    };

    if (currentBaseLayerRef.current) {
      map.removeLayer(currentBaseLayerRef.current);
    }

    const newBaseLayer = new TileLayer({
      source: new XYZ({ url: getSourceUrl(selectedBaseMap) }),
      zIndex: -1, // Ensure base map is always at the bottom
    });

    map.getLayers().insertAt(0, newBaseLayer);
    currentBaseLayerRef.current = newBaseLayer;

    return () => {
      if (map && newBaseLayer) {
        try {
          map.removeLayer(newBaseLayer);
        } catch (e) {
          // Ignore errors on cleanup if map is already destroyed
        }
      }
    };
  }, [map, selectedBaseMap]);

  return (
    <div className="base-map-switcher">
      <select
        value={selectedBaseMap}
        onChange={(e) => onSelectBaseMap(e.target.value)}
      >
        <option value="OSM">OSM</option>
        <option value="Google Satellite">Google Satellite</option>
        <option value="Google Hybrid">Google Hybrid</option>
      </select>
    </div>
  );
};

export default BaseMapSwitcher;
