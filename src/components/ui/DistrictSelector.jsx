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
  onLoadData, // Prop ໃໝ່ເພື່ອຮັບ event ການກົດປຸ່ມ
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

  // ກວດສອບວ່າມີເມືອງໃດຖືກເລືອກແລ້ວຫຼືບໍ່ ເພື່ອຄວບຄຸມສະຖານະປຸ່ມ
  const isAnyDistrictChecked = filteredDistricts.some((d) => d.checked);

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
          // ໃຊ້ Fragment ເພື່ອຫໍ່ຫຸ້ມ list ແລະ ປຸ່ມ
          <>
            <div className="district-grid">
              {filteredDistricts.length > 0 ? (
                filteredDistricts.map((district) => (
                  <div key={district.name} className="district-item">
                    <label>
                      {/* ປ່ຽນກັບມາເປັນ Checkbox */}
                      <input
                        type="checkbox"
                        checked={district.checked}
                        onChange={() => onToggle(district.name)}
                        style={{ accentColor: district.color }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span
                          className="district-color"
                          style={{ backgroundColor: district.color }}
                        ></span>
                        <span className="district-name">
                          {district.displayName}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginLeft: "auto",
                        }}
                      >
                        {district.loading && (
                          <Loader2
                            size={16}
                            className="animate-spin text-blue-400 ml-2"
                            title="ກຳລັງໂຫຼດ..."
                          />
                        )}
                        {district.error && (
                          <AlertCircle
                            size={16}
                            className="text-red-500 ml-2"
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

            {/* ເພີ່ມປຸ່ມໂຫຼດຂໍ້ມູນ */}
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
    </div>
  );
};

export default DistrictSelector;
