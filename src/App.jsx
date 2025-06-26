import React from "react";
import "./App.css"; // ຖ້າບໍ່ມີ style ຢູ່ໃນ App.css, ທ່ານສາມາດລຶບບັນທັດນີ້ໄດ້
import MapComponent from "./components/MapComponent";

function App() {
  // initialCenter ແລະ initialZoom ບໍ່ຈຳເປັນຕ້ອງຖືກສົ່ງເປັນ props ໃຫ້ MapComponent ໂດຍກົງ
  // ເພາະ MapComponent ຈັດການ state ຂອງມັນເອງແລ້ວ.
  // ຖ້າທ່ານຕ້ອງການໃຫ້ App.jsx ຄວບຄຸມ center/zoom ຢ່າງເຕັມທີ່, ທ່ານສາມາດສົ່ງພວກມັນຜ່ານ props.
  // ແຕ່ສຳລັບຕອນນີ້, MapComponent ຈັດການເອງ.

  return (
    // ສໍາຄັນ: ປ່ຽນ className ຈາກ "App" ເປັນ "app-container"
    // ແລະລຶບ <h1>MSM Web GIS</h1> ທີ່ຊ້ຳກັນອອກ
    <div className="app-container">
      <MapComponent />
      {/* ທ່ານສາມາດເພີ່ມ controls ຫຼື components ອື່ນໆໄດ້ທີ່ນີ້ ຖ້າຕ້ອງການໃຫ້ຢູ່ລວມກັບ App.jsx */}
    </div>
  );
}

export default App;
