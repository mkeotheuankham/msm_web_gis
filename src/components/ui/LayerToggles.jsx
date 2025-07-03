// src/components/ui/LayerToggles.jsx

import React from "react"; // import React
import { Layers } from "lucide-react"; // import Layers icon ຈາກ lucide-react

const LayerToggles = ({
  layerStates, // object ທີ່ເກັບ state ຂອງແຕ່ລະ layer (ເຊັ່ນ: isVisible, opacity)
  onVisibilityChange, // callback function ເມື່ອປ່ຽນແປງການເບິ່ງເຫັນຂອງ layer
  onOpacityChange, // callback function ເມື່ອປ່ຽນແປງຄວາມໂປ່ງໃສຂອງ layer
  isExpanded, // boolean ທີ່ບອກວ່າສ່ວນ controls ຖືກຂະຫຍາຍ (ເປີດ) ຢູ່ບໍ່
  onToggleExpansion, // callback function ເພື່ອສະຫຼັບການຂະຫຍາຍ/ຫຍໍ້
}) => {
  // Capitalize first letter for display
  const formatLayerName = (name) => {
    // function ສຳລັບປ່ຽນຊື່ layer ໃຫ້ມີຕົວອັກສອນທຳອິດເປັນຕົວພິມໃຫຍ່
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    // ສ່ວນ UI ຂອງ Layer Toggles
    <div className="sidebar-section">
      {/* Header ຂອງສ່ວນ Layers, ສາມາດຄລິກເພື່ອຂະຫຍາຍ/ຫຍໍ້ */}
      <div className="sidebar-section-header" onClick={onToggleExpansion}>
        <h3>
          <Layers size={16} style={{ marginRight: "8px" }} />{" "}
          {/* icon Layers */}
          ຊັ້ນຂໍ້ມູນ (Layers) {/* ຫົວຂໍ້ */}
        </h3>
        {/* You can add a chevron icon here if you want */}
      </div>

      {/* ສະແດງເນື້ອຫາເມື່ອ isExpanded ເປັນ true ເທົ່ານັ້ນ */}
      {isExpanded && (
        <div className="layer-controls-grid">
          {Object.entries(layerStates).map(([key, state]) => (
            // loop ຜ່ານ layerStates ເພື່ອສະແດງ controls ສຳລັບແຕ່ລະ layer
            <div key={key} className="layer-control-item">
              <label className="layer-toggle-label">
                <input
                  type="checkbox"
                  checked={state.isVisible} // ກຳນົດວ່າ checkbox ຖືກເລືອກຢູ່ບໍ່
                  onChange={(e) => onVisibilityChange(key, e.target.checked)} // ເມື່ອປ່ຽນແປງ, ເອີ້ນ onVisibilityChange
                />
                <span>{formatLayerName(key)}</span>{" "}
                {/* ສະແດງຊື່ layer ທີ່ຖືກ format ແລ້ວ */}
              </label>
              <div className="opacity-slider-container">
                <input
                  type="range"
                  min="0" // ຄ່າຕໍ່າສຸດ
                  max="1" // ຄ່າສູງສຸດ
                  step="0.1" // ຂັ້ນຕອນການປ່ຽນແປງ
                  value={state.opacity} // ຄ່າປັດຈຸບັນ
                  onChange={(e) =>
                    onOpacityChange(key, parseFloat(e.target.value))
                  } // ເມື່ອປ່ຽນແປງ, ເອີ້ນ onOpacityChange
                  disabled={!state.isVisible} // ປິດການໃຊ້ງານ slider ຖ້າ layer ບໍ່ເຫັນ
                  className="opacity-slider"
                />
                <span className="opacity-value">
                  {Math.round(state.opacity * 100)}%{" "}
                  {/* ສະແດງຄ່າຄວາມໂປ່ງໃສເປັນເປີເຊັນ */}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayerToggles; // export component
