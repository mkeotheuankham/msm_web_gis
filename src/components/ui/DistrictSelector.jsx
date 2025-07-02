import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";

const DistrictSelector = ({
  districts,
  onToggle,
  onLoadData,
  onOpacityChange,
  isExpanded,
  onToggleExpansion,
  selectedProvinceForDistricts,
}) => {
  const filteredDistricts = selectedProvinceForDistricts
    ? districts.filter((d) => d.province === selectedProvinceForDistricts)
    : [];

  const isAnyDistrictChecked = filteredDistricts.some((d) => d.checked);

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={onToggleExpansion}>
        <h3>ເມືອງ</h3>
        <button
          className="toggle-button"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="property-grid district-grid">
            {filteredDistricts.length > 0 ? (
              filteredDistricts.map((district) => (
                <div key={district.name} className="district-item-container">
                  <div className="district-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={district.checked}
                        onChange={() => onToggle(district.name)}
                      />
                      <div className="district-item-content">
                        <span
                          className="district-color"
                          style={{ backgroundColor: district.color }}
                        ></span>
                        <span className="district-name">
                          {district.displayName}
                        </span>
                      </div>
                      <div className="status-icons">
                        {district.loading && (
                          <Loader2
                            size={16}
                            className="animate-spin"
                            title="ກຳລັງໂຫຼດ..."
                          />
                        )}
                        {district.error && (
                          <AlertCircle
                            size={16}
                            color="red"
                            title={`ຂໍ້ຜິດພາດ: ${district.error}`}
                          />
                        )}
                      </div>
                    </label>
                  </div>

                  {district.hasLoaded && (
                    <div className="opacity-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={district.opacity}
                        onChange={(e) =>
                          onOpacityChange(district.name, e.target.value)
                        }
                        className="opacity-slider"
                      />
                      <span className="opacity-value">
                        {Math.round(district.opacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-districts-message">
                {selectedProvinceForDistricts
                  ? `ບໍ່ມີຂໍ້ມູນເມືອງສໍາລັບແຂວງນີ້`
                  : "ກະລຸນາເລືອກແຂວງກ່ອນ"}
              </p>
            )}
          </div>

          {filteredDistricts.length > 0 && (
            <button
              onClick={onLoadData}
              disabled={
                !isAnyDistrictChecked || districts.some((d) => d.loading)
              }
              className="load-data-button"
            >
              <Download size={16} style={{ marginRight: "8px" }} />
              ໂຫຼດຂໍ້ມູນຕອນດິນ
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DistrictSelector;
