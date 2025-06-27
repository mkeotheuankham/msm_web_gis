import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react"; // ນໍາເຂົ້າໄອຄອນລູກສອນ

const DistrictSelector = ({
  districts,
  onToggle,
  isSidebarCollapsed,
  isExpanded,
  onToggleExpansion,
  selectedProvinceForDistricts,
}) => {
  if (isSidebarCollapsed) {
    return null; // ບໍ່ສະແດງຫຍັງເມື່ອ sidebar ຖືກຫຍໍ້
  }

  // ກັ່ນຕອງເມືອງຕາມແຂວງທີ່ຖືກເລືອກ
  const filteredDistricts = selectedProvinceForDistricts
    ? districts.filter((d) => d.province === selectedProvinceForDistricts)
    : []; // ຖ້າບໍ່ມີແຂວງຖືກເລືອກ, ບໍ່ສະແດງເມືອງໃດໆ

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
        {" "}
        {/* wrapper ສໍາລັບ animation */}
        {isExpanded && (
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
                  ? `ບໍ່ມີຂໍ້ມູນເມືອງສໍາລັບແຂວງ ${selectedProvinceForDistricts}.`
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
