import React from "react";
import { fromLonLat } from "ol/proj";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

// --- CHANGE ---
// Removed `setCenter` and `setZoom` from props. They are not needed as
// `onProvinceSelectForMap` handles the map movement directly.
const ProvinceControls = ({
  openLayersLoaded,
  isSidebarCollapsed,
  isExpanded,
  onToggleExpansion,
  onProvinceSelectForMap,
}) => {
  const provinces = [
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

  // --- CHANGE ---
  // Simplified the handler. It only needs to call the onProvinceSelectForMap prop.
  const handleSetView = (coords, zoom, provinceName) => {
    if (openLayersLoaded) {
      // The `fromLonLat` function converts the standard coordinates
      // into the projection used by the map (EPSG:3857).
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
                onClick={() =>
                  handleSetView(province.coords, province.zoom, province.name)
                }
                disabled={!openLayersLoaded}
                className="province-button"
              >
                <MapPin size={18} />
                <span>{province.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvinceControls;
