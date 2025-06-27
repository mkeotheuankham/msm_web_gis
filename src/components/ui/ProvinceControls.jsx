import React from "react";
import { fromLonLat } from "ol/proj";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react"; // ນໍາເຂົ້າໄອຄອນລູກສອນ

const ProvinceControls = ({
  setCenter,
  setZoom,
  openLayersLoaded,
  isSidebarCollapsed,
  isExpanded,
  onToggleExpansion,
  onProvinceSelectForDistricts,
}) => {
  const provinces = [
    { name: "ນະຄອນຫຼວງວຽງຈັນ", coords: [102.6, 17.97], zoom: 12 }, // Vientiane Capital
    { name: "ຜົ້ງສາລີ", coords: [102.1, 21.68], zoom: 9 }, // Phongsaly
    { name: "ຫຼວງນໍ້າທາ", coords: [101.4, 20.95], zoom: 9 }, // Luang Namtha
    { name: "ບໍ່ແກ້ວ", coords: [100.43, 20.26], zoom: 9 }, // Bokeo (Houayxay)
    { name: "ອຸດົມໄຊ", coords: [101.98, 20.69], zoom: 9 }, // Oudomxay (Muang Xay)
    { name: "ຫຼວງພະບາງ", coords: [102.14, 19.89], zoom: 10 }, // Luang Prabang
    { name: "ຫົວພັນ", coords: [104.05, 20.42], zoom: 9 }, // Houaphanh (Xam Neua)
    { name: "ໄຊຍະບູລີ", coords: [101.75, 19.25], zoom: 9 }, // Sainyabuli (Xayabury)
    { name: "ຊຽງຂວາງ", coords: [103.18, 19.46], zoom: 9 }, // Xiangkhoang (Phonsavan)
    { name: "ວຽງຈັນ", coords: [102.45, 18.92], zoom: 9 }, // Vientiane Province (Phonhong or Vang Vieng area)
    { name: "ບໍລິຄໍາໄຊ", coords: [103.66, 18.38], zoom: 9 }, // Bolikhamxai (Pakxan)
    { name: "ຄໍາມ່ວນ", coords: [104.83, 17.41], zoom: 9 }, // Khammouane (Thakhek)
    { name: "ສະຫວັນນະເຂດ", coords: [104.75, 16.57], zoom: 9 }, // Savannakhet
    { name: "ສາລະວັນ", coords: [106.42, 15.72], zoom: 9 }, // Salavan
    { name: "ເຊກອງ", coords: [106.72, 15.34], zoom: 9 }, // Sekong (Lamam)
    { name: "ຈໍາປາສັກ", coords: [105.78, 15.12], zoom: 9 }, // Champasak (Pakxé)
    { name: "ອັດຕະປື", coords: [106.83, 14.8], zoom: 9 }, // Attapeu (Attopu)
    { name: "ໄຊສົມບູນ", coords: [102.9, 18.78], zoom: 9 }, // Xaisomboun (Anouvong) - Approximate central coordinates as precise capital not in initial search
  ];

  const handleSetView = (coords, zoom, provinceName) => {
    if (openLayersLoaded) {
      setCenter(fromLonLat(coords));
      setZoom(zoom);
      onProvinceSelectForDistricts(provinceName); // ແຈ້ງ MapComponent ວ່າແຂວງນີ້ຖືກເລືອກ
    }
  };

  if (isSidebarCollapsed) {
    return null; // ບໍ່ສະແດງຫຍັງເມື່ອ sidebar ຖືກຫຍໍ້
  }

  return (
    <div
      className={`province-controls ${isExpanded ? "expanded" : "collapsed"}`}
    >
      <div className="province-controls-header" onClick={onToggleExpansion}>
        <h3>ແຂວງ</h3>
        <button
          className="toggle-button"
          aria-label={isExpanded ? "Collapse provinces" : "Expand provinces"}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      <div className="province-content-wrapper">
        {" "}
        {/* wrapper ສໍາລັບ animation */}
        {isExpanded && (
          <div className="province-grid">
            {provinces.map((province) => (
              <button
                key={province.name}
                onClick={() =>
                  handleSetView(province.coords, province.zoom, province.name)
                } // ສົ່ງຊື່ແຂວງໄປພ້ອມ
                disabled={!openLayersLoaded}
                className="province-button" // No need for collapsed class here as it's handled by parent
              >
                <MapPin size={18} />
                <span>{province.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvinceControls;
