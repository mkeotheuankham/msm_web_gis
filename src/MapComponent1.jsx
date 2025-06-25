// src/MapComponent.jsx
import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";

import BaseMapSwitcher from "./components/BaseMapSwitcher"; // ✅ ต้องอ้างอิงให้ถูก path

// ✅ ข้อมูล BaseMap options พร้อมภาพ preview
const baseMapOptions = [
  {
    key: "osm",
    label: "OSM",
    img: "https://a.tile.openstreetmap.org/6/33/22.png",
    url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    key: "stadia",
    label: "Stadia",
    img: "https://tiles.stadiamaps.com/tiles/alidade_satellite/6/33/22.jpg",
    url: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg",
    attribution: "© Stadia Maps",
  },
  {
    key: "carto",
    label: "Carto",
    img: "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/6/33/22.png",
    url: "https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    attribution: "© Carto",
  },
  {
    key: "esri",
    label: "Esri",
    img: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/6/22/33",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
  },
];

const MapComponent = () => {
  const mapRef = useRef();
  const [baseMap, setBaseMap] = useState("osm");
  const mapObjRef = useRef();
  const baseLayersRef = useRef({});

  // ✅ สร้างแผนที่ครั้งแรก
  useEffect(() => {
    const layers = {};

    baseMapOptions.forEach((option) => {
      layers[option.key] = new TileLayer({
        source: new XYZ({
          url: option.url,
          attributions: option.attribution,
        }),
        visible: option.key === baseMap,
      });
    });

    baseLayersRef.current = layers;

    const map = new Map({
      target: mapRef.current,
      layers: Object.values(layers),
      view: new View({
        center: fromLonLat([100.5, 13.7]), // กลางประเทศไทย
        zoom: 5,
      }),
    });

    mapObjRef.current = map;

    return () => map.setTarget(null);
  }, []);

  // ✅ เมื่อเปลี่ยน base map
  useEffect(() => {
    Object.entries(baseLayersRef.current).forEach(([key, layer]) => {
      layer.setVisible(key === baseMap);
    });
  }, [baseMap]);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <BaseMapSwitcher
        baseMap={baseMap}
        setBaseMap={setBaseMap}
        options={baseMapOptions}
      />
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MapComponent;
