import React, { forwardRef, useState, useEffect, useRef } from "react";
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
      initialPosition = { x: 400, y: 10 }, // ກຳນົດຕຳແໜ່ງເລີ່ມຕົ້ນ (ຄ່າ default)
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(initialPosition);
    const offset = useRef({ x: 0, y: 0 }); // ໃຊ້ useRef ເພື່ອເກັບຄ່າ offset ໃນເວລາລາກ
    const toolbarLocalRef = useRef(null); // Ref ພາຍໃນສຳລັບ DOM element ຂອງ toolbar

    // ລວມ ref ພາຍໃນກັບ ref ທີ່ໄດ້ຮັບຈາກ parent component (MapComponent)
    // ນີ້ເຮັດໃຫ້ MapComponent ຍັງສາມາດອ້າງອີງໃສ່ toolbar ໄດ້
    React.useImperativeHandle(ref, () => toolbarLocalRef.current);

    // ຈັດການເຫດການເມົ້າລົງ (MouseDown) ເພື່ອເລີ່ມການລາກ
    const handleMouseDown = (e) => {
      e.preventDefault(); // ປ້ອງກັນການເລືອກຂໍ້ຄວາມ ຫຼືພຶດຕິກຳເລີ່ມຕົ້ນຂອງ browser
      setIsDragging(true);
      // ຄິດໄລ່ offset ລະຫວ່າງຈຸດຄລິກເມົ້າກັບຕຳແໜ່ງຂອງ toolbar
      offset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    };

    // ຈັດການເຫດການເມົ້າເຄື່ອນທີ່ (MouseMove) ໃນຂະນະທີ່ກຳລັງລາກ
    const handleMouseMove = (e) => {
      if (!isDragging) return; // ຖ້າບໍ່ໄດ້ລາກ, ໃຫ້ອອກຈາກຟັງຊັນ
      // ອັບເດດຕຳແໜ່ງໃໝ່ຂອງ toolbar ໂດຍອີງໃສ່ຕຳແໜ່ງເມົ້າປັດຈຸບັນ ແລະ offset
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    };

    // ຈັດການເຫດການເມົ້າຂຶ້ນ (MouseUp) ເພື່ອຢຸດການລາກ
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // ຈັດການເຫດການສໍາຜັດລົງ (TouchStart) ເພື່ອເລີ່ມການລາກ (ສຳລັບໜ້າຈໍສຳຜັດ)
    const handleTouchStart = (e) => {
      e.preventDefault(); // ປ້ອງກັນການເລື່ອນໜ້າຈໍ (scrolling)
      setIsDragging(true);
      const touch = e.touches[0];
      offset.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    };

    // ຈັດການເຫດການສໍາຜັດເຄື່ອນທີ່ (TouchMove) ໃນຂະນະທີ່ກຳລັງລາກ (ສຳລັບໜ້າຈໍສຳຜັດ)
    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - offset.current.x,
        y: touch.clientY - offset.current.y,
      });
    };

    // ຈັດການເຫດການສໍາຜັດສິ້ນສຸດ (TouchEnd) ເພື່ອຢຸດການລາກ (ສຳລັບໜ້າຈໍສຳຜັດ)
    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    // useEffect ສໍາລັບການເພີ່ມ/ລົບ Event Listeners ສໍາລັບການລາກ
    useEffect(() => {
      if (isDragging) {
        // ເພີ່ມ event listeners ໃສ່ `document` ເພື່ອໃຫ້ສາມາດລາກອອກນອກ toolbar ໄດ້
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        }); // `passive: false` ເພື່ອປ້ອງກັນການເລື່ອນໜ້າຈໍ
        document.addEventListener("touchend", handleTouchEnd);
      } else {
        // ລົບ event listeners ເມື່ອບໍ່ໄດ້ລາກ ເພື່ອປ້ອງກັນ Memory Leaks
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      }

      // Cleanup function: ຈະຖືກເຮັດວຽກເມື່ອ component unmount ຫຼື isDragging ປ່ຽນແປງ
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }, [isDragging, position]); // Dependencies: trigger effect ເມື່ອ isDragging ຫຼື position ປ່ຽນ

    return (
      // ໃຊ້ toolbarLocalRef ເພື່ອອ້າງອີງໃສ່ DOM element
      <div
        ref={toolbarLocalRef}
        className={`drawing-tools-floating ${isDragging ? "dragging" : ""}`}
        style={{ left: position.x, top: position.y }} // ໃຊ້ state 'position' ເພື່ອກຳນົດຕຳແໜ່ງ
        onMouseDown={handleMouseDown} // ເພີ່ມ event handler ສໍາລັບເມົ້າລົງ
        onTouchStart={handleTouchStart} // ເພີ່ມ event handler ສໍາລັບການສໍາຜັດລົງ
        tabIndex={0} // ເຮັດໃຫ້ div ສາມາດ Focus ໄດ້, ສໍາຄັນສໍາລັບ Accessibility
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
