// src/components/map/BaseMapSwitcher.jsx (Full Stable Version)

import React, { useEffect, useRef } from "react"; // import hooks ທີ່ຈຳເປັນຈາກ React
import TileLayer from "ol/layer/Tile"; // import TileLayer ຈາກ OpenLayers ສຳລັບ layer ແບບ tiles
import XYZ from "ol/source/XYZ"; // import XYZ ຈາກ OpenLayers ສຳລັບ source ແບບ XYZ (tiles)

const BaseMapSwitcher = ({ map, selectedBaseMap, onSelectBaseMap }) => {
  // ຮັບ map object, selectedBaseMap (ຊື່ແຜນທີ່ພື້ນຖານທີ່ຖືກເລືອກ), onSelectBaseMap (callback ເມື່ອມີການເລືອກແຜນທີ່ໃໝ່)
  const currentBaseLayerRef = useRef(null); // useRef ເກັບ reference ຂອງ base layer ປັດຈຸບັນ

  useEffect(() => {
    // useEffect ນີ້ຈະເຮັດວຽກເມື່ອ map ຫຼື selectedBaseMap ປ່ຽນແປງ
    if (!map) return; // ຖ້າບໍ່ມີ map, ບໍ່ຕ້ອງເຮັດຫຍັງ

    const getSourceUrl = (mapName) => {
      // function ສຳລັບກຳນົດ URL ຂອງ source ຕາມຊື່ແຜນທີ່
      switch (mapName) {
        case "Google Satellite":
          return "https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}"; // URL ສໍາລັບ Google Satellite
        case "Google Hybrid":
          return "https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"; // URL ສໍາລັບ Google Hybrid (ມີປ້າຍກຳກັບ)
        case "OSM":
        default:
          return "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"; // URL ສໍາລັບ OpenStreetMap (OSM)
      }
    };

    if (currentBaseLayerRef.current) {
      // ຖ້າມີ base layer ເກົ່າຢູ່
      map.removeLayer(currentBaseLayerRef.current); // ລຶບ base layer ເກົ່າອອກຈາກແຜນທີ່
    }

    const newBaseLayer = new TileLayer({
      // ສ້າງ TileLayer ໃໝ່
      source: new XYZ({ url: getSourceUrl(selectedBaseMap) }), // ໃຊ້ XYZ source ກັບ URL ຕາມແຜນທີ່ທີ່ຖືກເລືອກ
      zIndex: -1, // ຮັບປະກັນວ່າ base map ຢູ່ລຸ່ມສຸດສະເໝີ
    });

    map.getLayers().insertAt(0, newBaseLayer); // ເພີ່ມ layer ໃໝ່ເຂົ້າໄປໃນຕຳແໜ່ງທຳອິດຂອງ layers ໃນແຜນທີ່
    currentBaseLayerRef.current = newBaseLayer; // ເກັບ reference ຂອງ layer ໃໝ່

    return () => {
      // cleanup function ຂອງ useEffect
      if (map && newBaseLayer) {
        try {
          map.removeLayer(newBaseLayer); // ລຶບ layer ອອກເມື່ອ component unmount ຫຼື dependencies ປ່ຽນແປງ
        } catch {
          // Ignore errors on cleanup if map is already destroyed
          // ບໍ່ສົນໃຈ error ຖ້າ map ຖືກທຳລາຍໄປແລ້ວໃນຂະນະ cleanup
        }
      }
    };
  }, [map, selectedBaseMap]); // Dependencies ສຳລັບ useEffect

  return (
    // ສ່ວນ UI ຂອງ component
    <div className="base-map-switcher">
      <select
        value={selectedBaseMap} // ຄ່າຂອງ select box ແມ່ນແຜນທີ່ທີ່ຖືກເລືອກໃນປັດຈຸບັນ
        onChange={(e) => onSelectBaseMap(e.target.value)} // ເມື່ອມີການປ່ຽນແປງ, ເອີ້ນ onSelectBaseMap ດ້ວຍຄ່າທີ່ຖືກເລືອກ
      >
        <option value="OSM">OSM</option>
        <option value="Google Satellite">Google Satellite</option>
        <option value="Google Hybrid">Google Hybrid</option>
      </select>
    </div>
  );
};

export default BaseMapSwitcher; // export BaseMapSwitcher component
