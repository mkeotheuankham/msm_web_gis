import React from "react";
import {
  MapPin,
  LineChart,
  Square,
  Circle,
  Trash2,
  XCircle,
} from "lucide-react";

const DrawingToolbar = ({ onDrawTypeChange, onClearDrawings }) => {
  return (
    <div className="drawing-toolbar">
      {/* <h3>ເຄື່ອງມືແຕ້ມ</h3> */}
      <div className="drawing-buttons-grid">
        <button
          onClick={() => onDrawTypeChange("Point")}
          className="drawing-button"
          aria-label="ແຕ້ມຈຸດ" // Accessibility
        >
          <MapPin size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມຈຸດ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("LineString")}
          className="drawing-button"
          aria-label="ແຕ້ມເສັ້ນ"
        >
          <LineChart size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມເສັ້ນ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("Polygon")}
          className="drawing-button"
          aria-label="ແຕ້ມຮູບຫຼາຍລ່ຽມ"
        >
          <Square size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມຮູບຫຼາຍລ່ຽມ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("Circle")}
          className="drawing-button"
          aria-label="ແຕ້ມວົງມົນ"
        >
          <Circle size={20} />{" "}
          <span className="drawing-button-text">ແຕ້ມວົງມົນ</span>
        </button>
        <button
          onClick={onClearDrawings}
          className="drawing-button clear-button"
          aria-label="ລຶບຮູບແຕ້ມທັງໝົດ"
        >
          <Trash2 size={20} />{" "}
          <span className="drawing-button-text">ລຶບທັງໝົດ</span>
        </button>
        <button
          onClick={() => onDrawTypeChange("None")}
          className="drawing-button"
          aria-label="ຢຸດການແຕ້ມ"
        >
          <XCircle size={20} />{" "}
          <span className="drawing-button-text">ຢຸດແຕ້ມ</span>
        </button>
      </div>
    </div>
  );
};

export default DrawingToolbar;
