// src/components/ui/LayerToggles.jsx

import React from "react";
import { Layers } from "lucide-react";

const LayerToggles = ({
  layerStates,
  onVisibilityChange,
  onOpacityChange,
  isExpanded,
  onToggleExpansion,
}) => {
  // Capitalize first letter for display
  const formatLayerName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={onToggleExpansion}>
        <h3>
          <Layers size={16} style={{ marginRight: "8px" }} />
          ຊັ້ນຂໍ້ມູນ (Layers)
        </h3>
        {/* You can add a chevron icon here if you want */}
      </div>

      {isExpanded && (
        <div className="layer-controls-grid">
          {Object.entries(layerStates).map(([key, state]) => (
            <div key={key} className="layer-control-item">
              <label className="layer-toggle-label">
                <input
                  type="checkbox"
                  checked={state.isVisible}
                  onChange={(e) => onVisibilityChange(key, e.target.checked)}
                />
                <span>{formatLayerName(key)}</span>
              </label>
              <div className="opacity-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.opacity}
                  onChange={(e) =>
                    onOpacityChange(key, parseFloat(e.target.value))
                  }
                  disabled={!state.isVisible}
                  className="opacity-slider"
                />
                <span className="opacity-value">
                  {Math.round(state.opacity * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayerToggles;
