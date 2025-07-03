import React from "react"; // import React
import { MapPin, ChevronDown, ChevronUp } from "lucide-react"; // import icons ຈາກ lucide-react

const ProvinceControls = ({
  openLayersLoaded, // boolean ທີ່ບອກວ່າ OpenLayers ໂຫຼດສຳເລັດແລ້ວບໍ່
  isExpanded, // state ທີ່ບອກວ່າສ່ວນ controls ຖືກຂະຫຍາຍ (ເປີດ) ຢູ່ບໍ່
  onToggleExpansion, // callback function ເພື່ອສະຫຼັບການຂະຫຍາຍ/ຫຍໍ້
  onProvinceSelectForMap, // callback function ເມື່ອມີການເລືອກແຂວງເພື່ອຊູມໄປທີ່ແຂວງນັ້ນ
}) => {
  const provinces = [
    // ລາຍຊື່ object ຂອງແຂວງຕ່າງໆ ພ້ອມຂໍ້ມູນ: name, displayName, coords (ພິກັດໃຈກາງ), zoom (ລະດັບ zoom ທີ່ເໝາະສົມ)
    {
      name: "VientianeCapital",
      displayName: "ນະຄອນຫຼວງວຽງຈັນ",
      coords: [102.6, 17.97],
      zoom: 12,
    },
    {
      name: "Phongsaly",
      displayName: "ຜົ້ງສາລີ",
      coords: [102.1, 21.68],
      zoom: 9,
    },
    {
      name: "LuangNamtha",
      displayName: "ຫຼວງນໍ້າທາ",
      coords: [101.4, 20.95],
      zoom: 9,
    },
    {
      name: "Oudomxay",
      displayName: "ອຸດົມໄຊ",
      coords: [102.0, 20.69],
      zoom: 9,
    },
    { name: "Bokeo", displayName: "ບໍ່ແກ້ວ", coords: [100.5, 20.3], zoom: 9 },
    {
      name: "LuangPrabang",
      displayName: "ຫຼວງພະບາງ",
      coords: [102.0, 19.89],
      zoom: 9,
    },
    { name: "Huaphanh", displayName: "ຫົວພັນ", coords: [103.8, 20.4], zoom: 9 },
    {
      name: "Sayaboury",
      displayName: "ໄຊຍະບູລີ",
      coords: [101.7, 19.25],
      zoom: 9,
    },
    {
      name: "Xiangkhouang",
      displayName: "ຊຽງຂວາງ",
      coords: [103.3, 19.45],
      zoom: 9,
    },
    {
      name: "VientianeProvince",
      displayName: "ແຂວງວຽງຈັນ",
      coords: [102.4, 18.5],
      zoom: 9,
    },
    {
      name: "Bolikhamxay",
      displayName: "ບໍລິຄໍາໄຊ",
      coords: [104.0, 18.3],
      zoom: 9,
    },
    {
      name: "Khammouane",
      displayName: "ຄໍາມ່ວນ",
      coords: [104.8, 17.6],
      zoom: 9,
    },
    {
      name: "Savannakhet",
      displayName: "ສະຫວັນນະເຂດ",
      coords: [105.5, 16.5],
      zoom: 9,
    },
    {
      name: "Salavanh",
      displayName: "ສາລະວັນ",
      coords: [106.3, 15.7],
      zoom: 9,
    },
    { name: "Sekong", displayName: "ເຊກອງ", coords: [106.8, 15.3], zoom: 9 },
    {
      name: "Champasak",
      displayName: "ຈໍາປາສັກ",
      coords: [106.0, 14.8],
      zoom: 9,
    },
    { name: "Attapeu", displayName: "ອັດຕະປື", coords: [106.8, 14.2], zoom: 9 },
    {
      name: "Xaysomboun",
      displayName: "ໄຊສົມບູນ",
      coords: [102.9, 18.8],
      zoom: 10,
    },
  ];

  return (
    // ສ່ວນ UI ຂອງ Province Controls
    <div className="sidebar-section">
      {/* Header ຂອງສ່ວນແຂວງ, ສາມາດຄລິກເພື່ອຂະຫຍາຍ/ຫຍໍ້ */}
      <div className="sidebar-section-header" onClick={onToggleExpansion}>
        <h3>ແຂວງ</h3> {/* ຫົວຂໍ້: ແຂວງ */}
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
        <div className="property-grid province-grid">
          {provinces.map((province) => (
            // loop ຜ່ານລາຍຊື່ແຂວງເພື່ອສ້າງປຸ່ມສຳລັບແຕ່ລະແຂວງ
            <button
              key={province.name} // key ທີ່ເປັນເອກະລັກ
              onClick={() =>
                onProvinceSelectForMap(
                  province.coords, // ສົ່ງພິກັດໃຈກາງ
                  province.zoom, // ສົ່ງລະດັບ zoom
                  province.name // ສົ່ງຊື່ແຂວງ
                )
              }
              disabled={!openLayersLoaded} // ປິດການໃຊ້ງານປຸ່ມຖ້າ OpenLayers ຍັງບໍ່ໂຫຼດ
              className="province-button"
            >
              <MapPin size={16} style={{ marginRight: "8px" }} />{" "}
              {/* icon MapPin */}
              {province.displayName} {/* ສະແດງຊື່ແຂວງ */}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProvinceControls; // export component
