// src/components/ui/LayerToggles.jsx

import React, { useState } from "react";
// ນໍາເຂົ້າໄອຄອນຈາກ lucide-react ເພື່ອສະແດງຊັ້ນຂໍ້ມູນ ແລະ ໝວດໝູ່
import {
  Layers, // ໄອຄອນສໍາລັບຊັ້ນຂໍ້ມູນທົ່ວໄປ
  ChevronDown, // ໄອຄອນສໍາລັບການຫຍໍ້ພາກສ່ວນລົງ
  ChevronUp, // ໄອຄອນສໍາລັບການຂະຫຍາຍພາກສ່ວນຂຶ້ນ
  LandPlot, // ໄອຄອນສໍາລັບຊັ້ນຂໍ້ມູນທີ່ດິນ (ເຊັ່ນ: ຕອນດິນ)
  Cable, // ໄອຄອນສໍາລັບຊັ້ນຂໍ້ມູນພື້ນຖານໂຄງລ່າງ (ເຊັ່ນ: ຖະໜົນ, ອາຄານ, ສາທາລະນູປະໂພກ)
  Trees, // ໄອຄອນສໍາລັບຊັ້ນຂໍ້ມູນທໍາມະຊາດ (ເຊັ່ນ: ປ່າໄມ້)
  // Mountain, // ຕົວຢ່າງໄອຄອນທໍາມະຊາດອື່ນ (ບໍ່ໄດ້ໃຊ້ໃນປັດຈຸບັນ)
  Droplet, // ໄອຄອນສໍາລັບແຫຼ່ງນໍ້າ
  StretchVertical, // ໄອຄອນສະເພາະສໍາລັບເສັ້ນທາງ
  Building, // ໄອຄອນສະເພາະສໍາລັບສິ່ງປຸກສ້າງ
} from "lucide-react";

/**
 * ອົງປະກອບ LayerToggles: ຈັດການການສະແດງຜົນ ແລະ ການໂຕ້ຕອບຂອງຊັ້ນຂໍ້ມູນຕ່າງໆໃນແຜນທີ່,
 * ເຊິ່ງຈັດກຸ່ມເປັນໝວດໝູ່ທີ່ສາມາດຫຍໍ້/ຂະຫຍາຍໄດ້.
 *
 * @param {object} props - ຄຸນສົມບັດຂອງອົງປະກອບ.
 * @param {object} props.layerStates - ອອບເຈັກທີ່ຄີເປັນຊື່ຊັ້ນຂໍ້ມູນ ແລະ ຄ່າເປັນອອບເຈັກ
 * ປະກອບດ້ວຍ { isVisible: boolean, opacity: number }.
 * @param {function} props.onVisibilityChange - ຟັງຊັນ callback ເມື່ອການເບິ່ງເຫັນຂອງຊັ້ນຂໍ້ມູນປ່ຽນແປງ.
 * @param {function} props.onOpacityChange - ຟັງຊັນ callback ເມື່ອຄວາມໂປ່ງໃສຂອງຊັ້ນຂໍ້ມູນປ່ຽນແປງ.
 * @param {boolean} props.isExpanded - ຄວບຄຸມສະຖານະການຂະຫຍາຍໂດຍລວມຂອງພາກສ່ວນ LayerToggles ໃນແຖບຂ້າງ.
 * @param {function} props.onToggleExpansion - Callback ເພື່ອສະຫຼັບການຂະຫຍາຍໂດຍລວມຂອງພາກສ່ວນ LayerToggles.
 */
const LayerToggles = ({
  layerStates, // object ທີ່ເກັບ state ຂອງແຕ່ລະ layer (ເຊັ່ນ: isVisible, opacity)
  onVisibilityChange, // callback function ເມື່ອປ່ຽນແປງການເບິ່ງເຫັນຂອງ layer
  onOpacityChange, // callback function ເມື່ອປ່ຽນແປງຄວາມໂປ່ງໃສຂອງ layer
  isExpanded, // boolean ທີ່ບອກວ່າສ່ວນ controls ຖືກຂະຫຍາຍ (ເປີດ) ຢູ່ບໍ່
  onToggleExpansion, // callback function ເພື່ອສະຫຼັບການຂະຫຍາຍ/ຫຍໍ້
}) => {
  // ກໍານົດໂຄງສ້າງສໍາລັບການຈັດກຸ່ມຊັ້ນຂໍ້ມູນເປັນໝວດໝູ່.
  // ແຕ່ລະໝວດໝູ່ມີຊື່ທີ່ສະແດງ, ໄອຄອນທີ່ກ່ຽວຂ້ອງ, ແລະລາຍຊື່ຄີຂອງຊັ້ນຂໍ້ມູນ
  // ທີ່ເປັນຂອງໝວດໝູ່ນັ້ນ. ອັນນີ້ຊ່ວຍໃຫ້ການຈັດລະບຽບຊັ້ນຂໍ້ມູນຈໍານວນຫຼາຍມີເຫດຜົນ.
  const layerCategories = {
    cadastral: {
      displayName: "ຂໍ້ມູນຂອບເຂດ ແລະ ການນຳໃຊ້ທີ່ດິນ", // ຊື່ທີ່ຈະສະແດງສໍາລັບໝວດໝູ່ທີ່ດິນ
      icon: <LandPlot size={16} />, // ໄອຄອນສໍາລັບຫົວຂໍ້ໝວດໝູ່
      layers: ["parcel"], // ລາຍຊື່ຄີຂອງຊັ້ນຂໍ້ມູນໃນໝວດໝູ່ນີ້ (ເຊັ່ນ: "parcel", "land_use")
    },
    infrastructure: {
      displayName: "ຂໍ້ມູນພື້ນຖານໂຄງລ່າງ", // ຊື່ທີ່ຈະສະແດງສໍາລັບໝວດໝູ່ພື້ນຖານໂຄງລ່າງ
      icon: <Cable size={16} />, // ໄອຄອນສໍາລັບຫົວຂໍ້ໝວດໝູ່
      layers: ["StretchVertical", "building"], // ລາຍຊື່ຄີຂອງຊັ້ນຂໍ້ມູນ (ເຊັ່ນ: "road", "building", "utility_lines")
    },
    natural: {
      displayName: "ຂໍ້ມູນຊັບພະຍາກອນທຳມະຊາດ", // ຊື່ທີ່ຈະສະແດງສໍາລັບໝວດໝູ່ຊັບພະຍາກອນທຳມະຊາດ
      icon: <Trees size={16} />, // ໄອຄອນສໍາລັບຫົວຂໍ້ໝວດໝູ່
      layers: ["water"], // ລາຍຊື່ຄີຂອງຊັ້ນຂໍ້ມູນ (ເຊັ່ນ: "water", "forests", "topography")
    },
    // ສາມາດເພີ່ມໝວດໝູ່ໃນອະນາຄົດໄດ້ທີ່ນີ້ຕາມໂຄງສ້າງດຽວກັນ.
  };

  // State ເພື່ອຈັດການວ່າໝວດໝູ່ໃດທີ່ກໍາລັງຂະຫຍາຍຢູ່ (ເບິ່ງເຫັນໄດ້).
  // ເລີ່ມຕົ້ນດ້ວຍຄີຂອງໝວດໝູ່ທັງໝົດ, ເຮັດໃຫ້ພວກມັນທັງໝົດຂະຫຍາຍໂດຍຄ່າເລີ່ມຕົ້ນ.
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(layerCategories)
  );

  /**
   * ສະຫຼັບສະຖານະການຂະຫຍາຍຂອງໝວດໝູ່ຊັ້ນຂໍ້ມູນສະເພາະ.
   * ຖ້າໝວດໝູ່ກໍາລັງຂະຫຍາຍຢູ່, ມັນຈະຖືກຫຍໍ້ລົງ; ຖ້າບໍ່ດັ່ງນັ້ນ, ມັນຈະຂະຫຍາຍອອກ.
   * @param {string} categoryName - ຄີຂອງໝວດໝູ່ທີ່ຈະສະຫຼັບ (ເຊັ່ນ: "cadastral").
   */
  const toggleCategoryExpansion = (categoryName) => {
    setExpandedCategories(
      (prev) =>
        prev.includes(categoryName)
          ? prev.filter((name) => name !== categoryName) // ຖ້າຂະຫຍາຍຢູ່, ລຶບອອກຈາກລາຍຊື່ເພື່ອຫຍໍ້
          : [...prev, categoryName] // ຖ້າຫຍໍ້ຢູ່, ເພີ່ມເຂົ້າໃນລາຍຊື່ເພື່ອຂະຫຍາຍ
    );
  };

  /**
   * ໃຫ້ຊື່ທີ່ຈະສະແດງທີ່ມະນຸດອ່ານເຂົ້າໃຈໄດ້ສໍາລັບແຕ່ລະຄີຂອງຊັ້ນຂໍ້ມູນ.
   * ອັນນີ້ຊ່ວຍໃຫ້ມີຊື່ທີ່ລະອຽດກວ່າໃນ UI ຫຼາຍກວ່າຄີຊັ້ນຂໍ້ມູນພາຍໃນ.
   * @param {string} name - ຄີພາຍໃນຂອງຊັ້ນຂໍ້ມູນ (ເຊັ່ນ: "parcel", "road").
   * @returns {string} ຊື່ທີ່ຈະສະແດງທີ່ຖືກຈັດຮູບແບບສໍາລັບຊັ້ນຂໍ້ມູນ.
   */
  const formatLayerName = (name) => {
    switch (name) {
      case "parcel":
        return "ຕອນດິນ (Parcels)";
      case "road":
        return "ເສັ້ນທາງ (Roads)";
      case "building":
        return "ສິ່ງປຸກສ້າງ (Buildings)";
      case "water":
        return "ພື້ນທີ່ນ້ຳ (Water Bodies)"; // ຊື່ທີ່ຈະສະແດງແບບກຳນົດເອງສໍາລັບຊັ້ນຂໍ້ມູນນໍ້າໃໝ່
      default:
        // Fallback ສໍາລັບຊັ້ນຂໍ້ມູນທີ່ບໍ່ໄດ້ກໍານົດໄວ້ຢ່າງຊັດເຈນ, ພຽງແຕ່ເຮັດໃຫ້ຕົວອັກສອນທໍາອິດເປັນຕົວພິມໃຫຍ່
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
  };

  /**
   * ສົ່ງຄືນໄອຄອນສະເພາະສໍາລັບແຕ່ລະຊັ້ນຂໍ້ມູນ, ເພີ່ມການລະບຸຕົວຕົນດ້ວຍສາຍຕາ.
   * @param {string} layerName - ຄີພາຍໃນຂອງຊັ້ນຂໍ້ມູນ.
   * @returns {JSX.Element|null} ອົງປະກອບໄອຄອນ ຫຼື null ຖ້າບໍ່ມີໄອຄອນສະເພາະຖືກກໍານົດ.
   */
  const getLayerIcon = (layerName) => {
    switch (layerName) {
      case "parcel":
        return <LandPlot size={14} />;
      case "road":
        return <Road size={14} />;
      case "building":
        return <Building size={14} />;
      case "water":
        return <Droplet size={14} />;
      default:
        return null; // ສາມາດສົ່ງຄືນໄອຄອນທົ່ວໄປໄດ້ທີ່ນີ້ຖ້າຕ້ອງການ
    }
  };

  return (
    // ສ່ວນ UI ຂອງ Layer Toggles
    <div className="sidebar-section">
      {/* ຫົວຂໍ້ສໍາລັບພາກສ່ວນ "Layers" ໂດຍລວມ, ພ້ອມຟັງຊັນການສະຫຼັບ */}

      <div className="sidebar-section-header" onClick={onToggleExpansion}>
        <h3>
          <Layers size={16} style={{ marginRight: "8px" }} />{" "}
          {/* icon Layers */}
          ຊັ້ນຂໍ້ມູນ (Layers) {/* ຫົວຂໍ້ */}
        </h3>
        {/* ປຸ່ມເພື່ອສະຫຼັບການຂະຫຍາຍຂອງອົງປະກອບ LayerToggles ທັງໝົດ */}
        <button
          className="toggle-button"
          aria-label={isExpanded ? "Collapse" : "Expand"} // ປ້າຍຊື່ສໍາລັບການຊ່ວຍເຂົ້າເຖິງ
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* ການສະແດງຜົນແບບມີເງື່ອນໄຂ: ສະແດງໝວດໝູ່ເມື່ອພາກສ່ວນ Layers ຫຼັກຖືກຂະຫຍາຍເທົ່ານັ້ນ */}
      {isExpanded && (
        <div className="layer-categories-container">
          {/* ວົນຊໍ້າຜ່ານແຕ່ລະໝວດໝູ່ຊັ້ນຂໍ້ມູນທີ່ຖືກກໍານົດໄວ້ */}
          {Object.entries(layerCategories).map(([categoryKey, category]) => (
            <div key={categoryKey} className="layer-category">
              {/* ຫົວຂໍ້ສໍາລັບໝວດໝູ່ຊັ້ນຂໍ້ມູນແຕ່ລະອັນ, ພ້ອມຟັງຊັນການສະຫຼັບ */}
              <div
                className="category-header"
                onClick={() => toggleCategoryExpansion(categoryKey)}
              >
                {category.icon} {/* ສະແດງໄອຄອນໝວດໝູ່ */}
                <h4>{category.displayName}</h4> {/* ສະແດງຊື່ໝວດໝູ່ */}
                {/* ປຸ່ມເພື່ອສະຫຼັບການຂະຫຍາຍຂອງໝວດໝູ່ແຕ່ລະອັນ */}
                <button
                  className="toggle-button"
                  aria-label={
                    expandedCategories.includes(categoryKey)
                      ? "Collapse category"
                      : "Expand category"
                  }
                >
                  {expandedCategories.includes(categoryKey) ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
              {/* ການສະແດງຜົນແບບມີເງື່ອນໄຂ: ສະແດງຊັ້ນຂໍ້ມູນພາຍໃນໝວດໝູ່ນີ້ເມື່ອມັນຖືກຂະຫຍາຍເທົ່ານັ້ນ */}
              {expandedCategories.includes(categoryKey) && (
                <div className="layer-controls-grid">
                  {/* ວົນຊໍ້າຜ່ານແຕ່ລະຊັ້ນຂໍ້ມູນທີ່ຖືກກໍານົດພາຍໃນໝວດໝູ່ປັດຈຸບັນ */}
                  {category.layers.map((layerName) => {
                    const state = layerStates[layerName]; // ຮັບສະຖານະປັດຈຸບັນຂອງຊັ້ນຂໍ້ມູນ
                    if (!state) return null; // ຂ້າມຖ້າບໍ່ພົບສະຖານະຊັ້ນຂໍ້ມູນ (ເຊັ່ນ: ຄີສະກົດຜິດ)

                    return (
                      <div key={layerName} className="layer-control-item">
                        {/* Checkbox ສໍາລັບການເບິ່ງເຫັນຂອງຊັ້ນຂໍ້ມູນ */}
                        <label className="layer-toggle-label">
                          <input
                            type="checkbox"
                            checked={state.isVisible}
                            onChange={(e) =>
                              onVisibilityChange(layerName, e.target.checked)
                            }
                          />
                          {getLayerIcon(layerName)}{" "}
                          {/* ສະແດງໄອຄອນສະເພາະຂອງຊັ້ນຂໍ້ມູນ */}
                          <span>{formatLayerName(layerName)}</span>{" "}
                          {/* ສະແດງຊື່ຊັ້ນຂໍ້ມູນທີ່ຖືກຈັດຮູບແບບ */}
                        </label>
                        {/* ແຖບເລື່ອນຄວາມໂປ່ງໃສສໍາລັບຊັ້ນຂໍ້ມູນ */}
                        <div className="opacity-slider-container">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={state.opacity}
                            onChange={(e) =>
                              onOpacityChange(
                                layerName,
                                parseFloat(e.target.value)
                              )
                            }
                            disabled={!state.isVisible} // ປິດການໃຊ້ງານແຖບເລື່ອນຖ້າຊັ້ນຂໍ້ມູນບໍ່ເບິ່ງເຫັນ
                            className="opacity-slider"
                          />
                          <span className="opacity-value">
                            {Math.round(state.opacity * 100)}%{" "}
                            {/* ສະແດງຄວາມໂປ່ງໃສເປັນເປີເຊັນ */}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayerToggles; // export component
