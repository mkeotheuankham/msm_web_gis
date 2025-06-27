import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const DistrictSelector = ({
  districts,
  onToggle,
  isSidebarCollapsed,
  isExpanded,
  onToggleExpansion,
  selectedProvinceForDistricts,
  onDistrictSelectForBuildings,
}) => {
  if (isSidebarCollapsed) {
    return null;
  }

  // Filter districts based on the selected province
  const filteredDistricts = selectedProvinceForDistricts
    ? districts.filter((d) => d.province === selectedProvinceForDistricts)
    : [];

  const handleDistrictToggle = (districtName) => {
    onToggle(districtName); // Existing toggle for parcel layers
    onDistrictSelectForBuildings(districtName); // New: pass selected district for building layers
  };

  return (
    <div
      className={`district-selector ${isExpanded ? "expanded" : "collapsed"}`}
    >
      <div className="district-selector-header" onClick={onToggleExpansion}>
        <h3>ເມືອງ</h3>
        <button
          className="toggle-button"
          aria-label={isExpanded ? "Collapse districts" : "Expand districts"}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      <div className="district-content-wrapper">
        {isExpanded && (
          <div className="district-grid">
            {filteredDistricts.length > 0 ? (
              filteredDistricts.map((district) => (
                <div key={district.name} className="district-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={district.checked}
                      onChange={() => handleDistrictToggle(district.name)} // Use the new handler
                      style={{ accentColor: district.color }}
                    />
                    <>
                      <span
                        className="district-color"
                        style={{ backgroundColor: district.color }}
                      ></span>
                      <span className="district-name">
                        {district.displayName}
                      </span>
                    </>
                  </label>
                </div>
              ))
            ) : (
              <p className="no-districts-message">
                {selectedProvinceForDistricts
                  ? `ບໍ່ມີຂໍ້ມູນເມືອງສໍາລັບແຂວງ "${selectedProvinceForDistricts}" ນີ້. (ກະລຸນາກວດສອບ MapComponent.jsx ເພື່ອເພີ່ມຂໍ້ມູນເມືອງສໍາລັບແຂວງນີ້)`
                  : "ກະລຸນາເລືອກແຂວງເພື່ອເບິ່ງລາຍຊື່ເມືອງ."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictSelector;
