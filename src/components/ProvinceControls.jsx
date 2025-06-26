import React from "react";

// ຮັບ isSidebarCollapsed prop ເພີ່ມເຕີມ
function ProvinceControls({
  setCenter,
  setZoom,
  openLayersLoaded,
  isSidebarCollapsed,
}) {
  const provinces = [
    { name: "ນະຄອນຫຼວງວຽງຈັນ", coords: [102.6, 17.96] },
    { name: "ຜົ້ງສາລີ", coords: [102.1, 21.68] },
    { name: "ຫຼວງນໍ້າທາ", coords: [101.4, 21.0] },
    { name: "ບໍ່ແກ້ວ", coords: [100.9, 20.3] },
    { name: "ອຸດົມໄຊ", coords: [102.0, 20.0] },
    { name: "ຫຼວງພະບາງ", coords: [102.13, 19.89] },
    { name: "ຫົວພັນ", coords: [103.9, 20.4] },
    { name: "ໄຊຍະບູລີ", coords: [101.7, 19.2] },
    { name: "ຊຽງຂວາງ", coords: [103.5, 19.4] },
    { name: "ວຽງຈັນ", coords: [102.4, 18.5] },
    { name: "ບໍລິຄຳໄຊ", coords: [104.0, 18.2] },
    { name: "ຄຳມ່ວນ", coords: [105.0, 17.5] },
    { name: "ສະຫວັນນະເຂດ", coords: [105.5, 16.5] },
    { name: "ສາລະວັນ", coords: [106.3, 16.0] },
    { name: "ເຊກອງ", coords: [106.8, 15.6] },
    { name: "ຈໍາປາສັກ", coords: [106.0, 14.8] },
    { name: "ອັດຕະປື", coords: [106.8, 14.3] },
    { name: "ໄຊສົມບູນ", coords: [102.9, 18.8] },
  ];

  return (
    <div className="province-grid">
      {provinces.map((province) => (
        <button
          key={province.name}
          onClick={() => {
            setCenter(province.coords);
            setZoom(10);
          }}
          // ແກ້ໄຂ: ຍ້າຍຄໍາເຫັນອອກຈາກ attribute value string
          className={`province-button ${
            isSidebarCollapsed ? "province-button-collapsed" : ""
          }`}
          disabled={!openLayersLoaded}
        >
          📍 <span>{province.name}</span> {/* ຫໍ່ຊື່ແຂວງດ້ວຍ <span> */}
        </button>
      ))}
    </div>
  );
}

export default ProvinceControls;
