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
  isSidebarCollapsed,
  isExpanded,
  onToggleExpansion,
  selectedProvinceForDistricts,
}) => {
  if (isSidebarCollapsed) {
    return null;
  }

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
          aria-label={isExpanded ? "Collapse districts" : "Expand districts"}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="district-grid">
            {filteredDistricts.length > 0 ? (
              filteredDistricts.map((district) => (
                <div key={district.name} className="district-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={district.checked}
                      onChange={() => onToggle(district.name)}
                      style={{ accentColor: district.color }}
                    />
                    {/* --- NEW WRAPPER for color and name --- */}
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
                          className="animate-spin text-blue-400"
                          title="ກຳລັງໂຫຼດ..."
                        />
                      )}
                      {district.error && (
                        <AlertCircle
                          size={16}
                          className="text-red-500"
                          title={`ຂໍ້ຜິດພາດ: ${district.error}`}
                        />
                      )}
                    </div>
                  </label>
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
              disabled={!isAnyDistrictChecked}
              className="load-data-button"
            >
              <Download size={16} style={{ marginRight: "8px" }} />
              ໂຫຼດຂໍ້ມູນແຜນທີ່
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DistrictSelector;
