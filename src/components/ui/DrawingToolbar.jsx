import React, { forwardRef } from "react";
import {
  Pencil,
  Square,
  Minus,
  Trash2,
  Circle,
  RectangleHorizontal,
} from "lucide-react"; // ນໍາເຂົ້າໄອຄອນໃໝ່

// ໃຊ້ forwardRef ເພື່ອໃຫ້ MapComponent ສາມາດອ້າງອີງໃສ່ DOM element ຂອງ toolbar
const DrawingToolbar = forwardRef(
  (
    {
      onSelectDrawingMode,
      onClearDrawing,
      currentMode,
      onMouseDown,
      onTouchStart,
      style,
      isDragging,
    },
    ref
  ) => {
    return (
      // ໃຊ້ ref ແລະ event handlers ສໍາລັບການລາກ
      // ເພີ່ມ tabIndex ເພື່ອໃຫ້ສາມາດ focus ໄດ້, ສໍາຄັນສໍາລັບ accessibility
      <div
        ref={ref}
        className={`drawing-tools-floating ${isDragging ? "dragging" : ""}`}
        style={style}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        tabIndex={0} // Makes the div focusable
        aria-label="ແຖບເຄື່ອງມືແຕ້ມ" // Accessibility label
      >
        <h3>Tools</h3> {/* CSS ຈະເຊື່ອງຫົວຂໍ້ນີ້ຕາມ default */}
        <div className="drawing-buttons-grid">
          <button
            className={`drawing-button ${
              currentMode === "Point" ? "active" : ""
            }`}
            onClick={() => onSelectDrawingMode("Point")}
            title="ແຕ້ມຈຸດ" // Updated title to Lao
            aria-label="ແຕ້ມຈຸດ" // Accessibility label
          >
            <Pencil size={18} />
            <span className="drawing-button-text">ຈຸດ</span>
          </button>
          <button
            className={`drawing-button ${
              currentMode === "LineString" ? "active" : ""
            }`}
            onClick={() => onSelectDrawingMode("LineString")}
            title="ແຕ້ມເສັ້ນ" // Updated title to Lao
            aria-label="ແຕ້ມເສັ້ນ" // Accessibility label
          >
            <Minus size={18} />
            <span className="drawing-button-text">ເສັ້ນ</span>
          </button>
          <button
            className={`drawing-button ${
              currentMode === "Polygon" ? "active" : ""
            }`}
            onClick={() => onSelectDrawingMode("Polygon")}
            title="ແຕ້ມຮູບຫຼາຍລ່ຽມ" // Updated title to Lao
            aria-label="ແຕ້ມຮູບຫຼາຍລ່ຽມ" // Accessibility label
          >
            <Square size={18} />
            <span className="drawing-button-text">ຮູບຫຼາຍລ່ຽມ</span>
          </button>
          <button
            className={`drawing-button ${
              currentMode === "Circle" ? "active" : ""
            }`}
            onClick={() => onSelectDrawingMode("Circle")}
            title="ແຕ້ມວົງມົນ" // New button for Circle
            aria-label="ແຕ້ມວົງມົນ"
          >
            <Circle size={18} />
            <span className="drawing-button-text">ວົງມົນ</span>
          </button>
          <button
            className={`drawing-button ${
              currentMode === "Box" ? "active" : ""
            }`}
            onClick={() => onSelectDrawingMode("Box")}
            title="ແຕ້ມສີ່ຫຼ່ຽມ" // New button for Box/Rectangle
            aria-label="ແຕ້ມສີ່ຫຼ່ຽມ"
          >
            <RectangleHorizontal size={18} />
            <span className="drawing-button-text">ສີ່ຫຼ່ຽມ</span>
          </button>
          <button
            className="drawing-button clear-button"
            onClick={onClearDrawing}
            title="ລຶບຮູບແຕ້ມທັງໝົດ" // Updated title to Lao
            aria-label="ລຶບຮູບແຕ້ມທັງໝົດ" // Accessibility label
          >
            <Trash2 size={18} />
            <span className="drawing-button-text">ລຶບທັງໝົດ</span>
          </button>
        </div>
      </div>
    );
  }
);

export default DrawingToolbar;
