import React from "react";
import { fromLonLat } from "ol/proj";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

const ProvinceControls = ({
  setCenter,
  setZoom,
  openLayersLoaded,
  isSidebarCollapsed,
  isExpanded,
  onToggleExpansion,
  onProvinceSelectForMap,
}) => {
  const provinces = [
    // !!! ສໍາຄັນ: "name" ນີ້ຈະຖືກໃຊ້ສໍາລັບການກັ່ນຕອງເມືອງ ແລະ ຂໍ້ມູນເສັ້ນທາງ !!!
    // "displayName" ແມ່ນສໍາລັບການສະແດງຜົນເທົ່ານັ້ນ.
    // ໃຫ້ແນ່ໃຈວ່າ "name" ກົງກັນລະຫວ່າງ MapComponent ແລະ ProvinceControls
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
    { name: "Bokeo", displayName: "ບໍ່ແກ້ວ", coords: [100.43, 20.26], zoom: 9 },
    {
      name: "Oudomxay",
      displayName: "ອຸດົມໄຊ",
      coords: [101.98, 20.69],
      zoom: 9,
    },
    {
      name: "LuangPrabang",
      displayName: "ຫຼວງພະບາງ",
      coords: [102.14, 19.89],
      zoom: 10,
    },
    {
      name: "Houaphanh",
      displayName: "ຫົວພັນ",
      coords: [104.05, 20.42],
      zoom: 9,
    },
    {
      name: "Sainyabuli",
      displayName: "ໄຊຍະບູລີ",
      coords: [101.75, 19.25],
      zoom: 9,
    },
    {
      name: "Xiangkhoang",
      displayName: "ຊຽງຂວາງ",
      coords: [103.18, 19.46],
      zoom: 9,
    },
    {
      name: "VientianeProvince",
      displayName: "ວຽງຈັນ",
      coords: [102.45, 18.92],
      zoom: 9,
    },
    {
      name: "Bolikhamxai",
      displayName: "ບໍລິຄໍາໄຊ",
      coords: [103.66, 18.38],
      zoom: 9,
    },
    {
      name: "Khammouane",
      displayName: "ຄໍາມ່ວນ",
      coords: [104.83, 17.41],
      zoom: 9,
    },
    {
      name: "Savannakhet",
      displayName: "ສະຫວັນນະເຂດ",
      coords: [104.75, 16.57],
      zoom: 9,
    },
    {
      name: "Salavan",
      displayName: "ສາລະວັນ",
      coords: [106.42, 15.72],
      zoom: 9,
    },
    { name: "Sekong", displayName: "ເຊກອງ", coords: [106.72, 15.34], zoom: 9 },
    {
      name: "Champasak",
      displayName: "ຈໍາປາສັກ",
      coords: [105.78, 15.12],
      zoom: 9,
    },
    {
      name: "Attapeu",
      displayName: "ອັດຕະປື",
      coords: [106.83, 14.8],
      zoom: 9,
    },
    {
      name: "Xaisomboun",
      displayName: "ໄຊສົມບູນ",
      coords: [102.9, 18.78],
      zoom: 9,
    },
  ];

  const handleSetView = (coords, zoom, provinceName) => {
    if (openLayersLoaded) {
      // Convert LonLat to map projection coordinates before sending to MapComponent
      // MapComponent will then update its state and the map view
      onProvinceSelectForMap(fromLonLat(coords), zoom, provinceName);
    } else {
      console.warn("OpenLayers map is not loaded yet. Cannot set view.");
    }
  };

  if (isSidebarCollapsed) {
    return null;
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
        {isExpanded && (
          <div className="province-grid">
            {provinces.map((province) => (
              <button
                key={province.name}
                // Pass province.name to handleSetView to be used for filtering districts/roads
                onClick={() =>
                  handleSetView(province.coords, province.zoom, province.name)
                }
                disabled={!openLayersLoaded}
                className="province-button"
              >
                <MapPin size={18} />
                <span>{province.displayName}</span> {/* Display the Lao name */}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvinceControls;
