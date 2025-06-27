import React from "react";

const BaseMapSwitcher = ({
  map,
  selectedBaseMap,
  onSelectBaseMap,
  isSidebarCollapsed,
}) => {
  // ກວດສອບວ່າ map instance ຖືກສົ່ງມາແລ້ວ ຫຼືບໍ່
  // ຖ້າ map ຍັງບໍ່ມີຄ່າ, ໃຫ້ return null ເພື່ອບໍ່ສະແດງຫຍັງເລີຍ
  // ນີ້ຈະແກ້ໄຂບັນຫາ "Cannot read properties of undefined (reading 'map')"
  if (!map) {
    console.warn(
      "BaseMapSwitcher: Map instance not yet available, rendering null."
    );
    return null;
  }

  // ດຶງຂໍ້ມູນຊັ້ນພື້ນຖານຈາກ map object
  const baseLayers = map
    .getLayers()
    .getArray()
    .filter(
      (layer) =>
        layer.get("name") === "OSM" ||
        layer.get("name") === "Google Satellite" ||
        layer.get("name") === "Google Hybrid"
    );

  const handleBaseMapChange = (event) => {
    // ປ່ຽນເປັນຮັບ event
    const newBaseMapName = event.target.value;
    onSelectBaseMap(newBaseMapName); // ດຶງຄ່າຈາກ event.target.value

    // ເປີດ/ປິດການເບິ່ງເຫັນຂອງ layer ໂດຍກົງທີ່ນີ້
    map.getLayers().forEach((layer) => {
      if (layer.get("name") === newBaseMapName) {
        layer.setVisible(true);
      } else {
        // ປິດ layer ອື່ນໆ, ແຕ່ຕ້ອງແນ່ໃຈວ່າບໍ່ປິດ layer ຂໍ້ມູນ (parcel layer)
        // ໂດຍການກວດສອບ layer name
        if (
          !layer.get("name").startsWith("parcel_layer_") &&
          layer.get("name") !== "drawing_layer"
        ) {
          layer.setVisible(false);
        }
      }
    });
  };

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
