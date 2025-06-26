import React from "react";
import {
  MapPin,
  LineChart,
  Square,
  Circle,
  Trash2,
  XCircle,
} from "lucide-react"; // ນໍາເຂົ້າໄອຄອນຈາກ lucide-react

// DrawingToolbar component ຮັບ prop 'onDrawTypeChange' ແລະ 'onClearDrawings'
// ເພື່ອຈັດການການປ່ຽນແປງປະເພດການແຕ້ມ ແລະການລຶບຮູບແຕ້ມ
const DrawingToolbar = ({ onDrawTypeChange, onClearDrawings }) => {
  return (
    <div className="drawing-toolbar">
      {/* ຫົວຂໍ້ນີ້ອາດຈະຖືກເຊື່ອງໄວ້ ຫຼືຈັດຮູບແບບແຕກຕ່າງກັນໃນ CSS ເພື່ອໃຫ້ເໝາະສົມກັບຮູບແບບແຖບເຄື່ອງມືແນວຕັ້ງ */}
      {/* <h3>ເຄື່ອງມືແຕ້ມ</h3> */}
      <div className="drawing-buttons-grid">
        <button
          onClick={() => onDrawTypeChange("Point")}
          className="drawing-button"
        >
          <MapPin size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມຈຸດ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("LineString")}
          className="drawing-button"
        >
          <LineChart size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມເສັ້ນ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("Polygon")}
          className="drawing-button"
        >
          <Square size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມຮູບຫຼາຍລ່ຽມ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("Circle")}
          className="drawing-button"
        >
          <Circle size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມວົງມົນ</span>
        </button>
        {/* ທ່ານສາມາດເພີ່ມເຄື່ອງມືອື່ນໆ ເຊັ່ນ: Modify, Select, Delete ຢູ່ບ່ອນນີ້ */}
        {/* <button onClick={() => onDrawTypeChange('Modify')} className="drawing-button">
          <Pencil size={20} /> <span className="drawing-button-text">ແກ້ໄຂ</span>
        </button>
        <button onClick={() => onDrawTypeChange('Select')} className="drawing-button">
          <MousePointer2 size={20} /> <span className="drawing-button-text">ເລືອກ</span>
        </button> */}
        <button
          onClick={onClearDrawings}
          className="drawing-button clear-button"
        >
          <Trash2 size={20} />{" "}
          <span className="drawing-button-text">ລຶບທັງໝົດ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("None")}
          className="drawing-button"
        >
          <XCircle size={20} />{" "}
          <span className="drawing-button-text">ຢຸດແຕ້ມ</span>
        </button>
      </div>
    </div>
  );
};

export default DrawingToolbar;
