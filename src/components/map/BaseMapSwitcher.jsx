import React from "react";

const BaseMapSwitcher = ({
  map,
  selectedBaseMap,
  onSelectBaseMap,
  isSidebarCollapsed,
}) => {
  if (!map) {
    console.warn(
      "BaseMapSwitcher: Map instance not yet available, rendering null."
    );
    return null;
  }

  // --- IMPROVEMENT START ---
  // ກໍານົດຊື່ຂອງ Base Layers ໄວ້ເພື່ອໃຫ້ງ່າຍຕໍ່ການກວດສອບ
  const baseLayerNames = ["OSM", "Google Satellite", "Google Hybrid"];

  // ດຶງຂໍ້ມູນຊັ້ນພື້ນຖານຈາກ map object
  const baseLayers = map
    .getLayers()
    .getArray()
    .filter((layer) => baseLayerNames.includes(layer.get("name")));

  const handleBaseMapChange = (event) => {
    const newBaseMapName = event.target.value;
    onSelectBaseMap(newBaseMapName);

    // ປັບປຸງ Logic: ໃຫ້วนลูปສະເພາະ Base Layers
    // ເພື່ອເປີດ/ປິດການເບິ່ງເຫັນ, ຈະບໍ່ມີຜົນກະທົບກັບ layers ອື່ນ (parcels, roads, etc.)
    map.getLayers().forEach((layer) => {
      const layerName = layer.get("name");
      if (baseLayerNames.includes(layerName)) {
        layer.setVisible(layerName === newBaseMapName);
      }
    });
  };
  // --- IMPROVEMENT END ---

  return (
    <div
      className={`base-map-switcher ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <label htmlFor="baseMapSelect">Base Map:</label>
      <select
        id="baseMapSelect"
        value={selectedBaseMap}
        onChange={handleBaseMapChange}
      >
        {baseLayers.map((layer) => (
          <option key={layer.get("name")} value={layer.get("name")}>
            {layer.get("name")}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BaseMapSwitcher;
