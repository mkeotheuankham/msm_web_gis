import React from "react";

// BaseMapSwitcher component accepts props for managing base map selection
const BaseMapSwitcher = ({
  activeBaseMap,
  setActiveBaseMap,
  baseMapLayers,
  openLayersLoaded,
}) => {
  return (
    <div className="base-map-switcher">
      <label htmlFor="base-map-select">ແຜນທີ່ຖານ:</label>
      <select
        id="base-map-select"
        value={activeBaseMap}
        onChange={(e) => setActiveBaseMap(e.target.value)}
        disabled={!openLayersLoaded} // Disable dropdown until map is loaded
      >
        {baseMapLayers.map((layer) => (
          <option key={layer.name} value={layer.name}>
            {layer.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BaseMapSwitcher;
