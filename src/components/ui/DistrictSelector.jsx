import React from "react"; // import React
import {
  ChevronDown, // icon ລູກສອນລົງ
  ChevronUp, // icon ລູກສອນຂຶ້ນ
  Loader2, // icon ໂຫຼດ (spinning loader)
  AlertCircle, // icon ແຈ້ງເຕືອນ (error)
  Download, // icon ດາວໂຫຼດ
} from "lucide-react"; // import icons ຈາກ lucide-react

const DistrictSelector = ({
  districts, // ລາຍຊື່ object ຂອງເມືອງ, ປະກອບມີຂໍ້ມູນເຊັ່ນ: name, checked, loading, error, opacity
  onToggle, // function ສຳລັບສະຫຼັບ state ຂອງ checkbox (ເລືອກ/ຍົກເລີກການເລືອກເມືອງ)
  onLoadData, // function ສຳລັບໂຫຼດຂໍ້ມູນຕອນດິນ
  onOpacityChange, // function ສຳລັບປ່ຽນແປງຄວາມໂປ່ງໃສຂອງ layer
  isExpanded, // state ທີ່ບອກວ່າສ່ວນເລືອກເມືອງຖືກເປີດອອກ (ຂະຫຍາຍ) ຫຼືບໍ່
  onToggleExpansion, // function ສຳລັບສະຫຼັບ state ການເປີດ/ປິດສ່ວນເລືອກເມືອງ
  selectedProvinceForDistricts, // ຊື່ແຂວງທີ່ຖືກເລືອກເພື່ອສະແດງລາຍຊື່ເມືອງທີ່ກ່ຽວຂ້ອງ
}) => {
  // ກັ່ນຕອງລາຍຊື່ເມືອງຕາມແຂວງທີ່ຖືກເລືອກ
  const filteredDistricts = selectedProvinceForDistricts
    ? districts.filter((d) => d.province === selectedProvinceForDistricts)
    : [];

  // ກວດສອບວ່າມີເມືອງໃດຖືກເລືອກ (checked) ຫຼືບໍ່
  const isAnyDistrictChecked = filteredDistricts.some((d) => d.checked);

  return (
    // ສ່ວນຂອງ UI ສຳລັບການເລືອກເມືອງ
    <div className="sidebar-section">
      {/* Header ຂອງສ່ວນເລືອກເມືອງ, ສາມາດຄລິກເພື່ອເປີດ/ປິດໄດ້ */}
      <div className="sidebar-section-header" onClick={onToggleExpansion}>
        <h3>ເມືອງ</h3> {/* ຫົວຂໍ້: ເມືອງ */}
        <button
          className="toggle-button"
          aria-label={isExpanded ? "Collapse" : "Expand"} // Accessibility label
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}{" "}
          {/* ສະແດງ icon ລູກສອນຂຶ້ນ ຫຼື ລູກສອນລົງ */}
        </button>
      </div>

      {/* ສະແດງເນື້ອຫາເມື່ອ isExpanded ເປັນ true ເທົ່ານັ້ນ */}
      {isExpanded && (
        <>
          <div className="property-grid district-grid">
            {filteredDistricts.length > 0 ? ( // ຖ້າມີລາຍຊື່ເມືອງທີ່ຖືກກັ່ນຕອງ
              filteredDistricts.map((district) => (
                // loop ຜ່ານແຕ່ລະເມືອງເພື່ອສະແດງຜົນ
                <div key={district.name} className="district-item-container">
                  <div className="district-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={district.checked} // ກຳນົດວ່າ checkbox ຖືກເລືອກຢູ່ບໍ່
                        onChange={() => onToggle(district.name)} // ເມື່ອປ່ຽນແປງ, ເອີ້ນ onToggle
                      />
                      <div className="district-item-content">
                        <span
                          className="district-color"
                          style={{ backgroundColor: district.color }} // ສະແດງສີສຳລັບເມືອງ
                        ></span>
                        <span className="district-name">
                          {district.displayName} {/* ສະແດງຊື່ເມືອງ */}
                        </span>
                      </div>
                      <div className="status-icons">
                        {district.loading && ( // ຖ້າກຳລັງໂຫຼດ
                          <Loader2
                            size={16}
                            className="animate-spin" // ເຮັດໃຫ້ icon ໝູນ
                            title="ກຳລັງໂຫຼດ..." // tooltip
                          />
                        )}
                        {district.error && ( // ຖ້າມີ error
                          <AlertCircle
                            size={16}
                            color="red" // icon ສີແດງ
                            title={`ຂໍ້ຜິດພາດ: ${district.error}`} // tooltip ສະແດງຂໍ້ຄວາມ error
                          />
                        )}
                      </div>
                    </label>
                  </div>

                  {district.hasLoaded && ( // ສະແດງ slider ຄວາມໂປ່ງໃສເມື່ອຂໍ້ມູນຖືກໂຫຼດແລ້ວ
                    <div className="opacity-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={district.opacity} // ຄ່າຂອງ slider
                        onChange={(e) =>
                          onOpacityChange(district.name, e.target.value)
                        } // ເມື່ອປ່ຽນແປງ, ເອີ້ນ onOpacityChange
                        className="opacity-slider"
                      />
                      <span className="opacity-value">
                        {Math.round(district.opacity * 100)}%{" "}
                        {/* ສະແດງຄ່າຄວາມໂປ່ງໃສເປັນເປີເຊັນ */}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // ສະແດງຂໍ້ຄວາມເມື່ອບໍ່ມີຂໍ້ມູນເມືອງ
              <p className="no-districts-message">
                {selectedProvinceForDistricts
                  ? `ບໍ່ມີຂໍ້ມູນເມືອງສໍາລັບແຂວງນີ້` // ຖ້າເລືອກແຂວງແລ້ວແຕ່ບໍ່ມີຂໍ້ມູນເມືອງ
                  : "ກະລຸນາເລືອກແຂວງກ່ອນ"}{" "}
                {/* ຖ້າຍັງບໍ່ໄດ້ເລືອກແຂວງ */}
              </p>
            )}
          </div>

          {filteredDistricts.length > 0 && ( // ສະແດງປຸ່ມໂຫຼດຂໍ້ມູນຕອນດິນຖ້າມີເມືອງທີ່ຖືກກັ່ນຕອງ
            <button
              onClick={onLoadData} // ເມື່ອຄລິກ, ເອີ້ນ onLoadData
              disabled={
                !isAnyDistrictChecked || districts.some((d) => d.loading)
              } // ປຸ່ມຈະຖືກປິດການໃຊ້ງານຖ້າບໍ່ມີເມືອງຖືກເລືອກ ຫຼື ມີເມືອງໃດໜຶ່ງກຳລັງໂຫຼດ
              className="load-data-button"
            >
              <Download size={16} style={{ marginRight: "8px" }} />{" "}
              {/* icon ດາວໂຫຼດ */}
              ໂຫຼດຂໍ້ມູນຕອນດິນ {/* ຂໍ້ຄວາມປຸ່ມ */}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DistrictSelector; // export component
