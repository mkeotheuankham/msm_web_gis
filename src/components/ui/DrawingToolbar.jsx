import React, { useState, useCallback, useRef, forwardRef } from "react";
import {
  Circle,
  Trash2,
  GripVertical,
  MousePointer,
  RectangleHorizontal,
  Pencil,
  Save,
  Undo2,
  Redo2,
  Magnet,
  Ruler,
  Scissors,
  GitMerge,
} from "lucide-react";

// Custom SVG Icons
const LineIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);
const PolygonIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 2l4 4-3 11H9l-4-4 3-11h6z" />
  </svg>
);
const MeasureAreaIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 5H3M13 19H3M21 12H3M13 5h2l4 7-4 7h-2" />
  </svg>
);

const DrawingToolbar = forwardRef(
  (
    {
      onSetInteractionMode,
      currentInteractionMode,
      onClearDrawing,
      initialPosition,
      isSnapActive,
      onToggleSnap,
      onUndo,
      onRedo,
      onSave,
      canUndo,
      canRedo,
    },
    ref
  ) => {
    const [position, setPosition] = useState(
      initialPosition || { x: 15, y: 120 }
    );
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const elementStartPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      elementStartPos.current = { ...position };
      e.preventDefault();
    };

    const handleMouseMove = useCallback(
      (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setPosition({
          x: elementStartPos.current.x + dx,
          y: elementStartPos.current.y + dy,
        });
      },
      [isDragging]
    );

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    React.useEffect(() => {
      if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const mainTools = [
      { type: "DrawPoint", icon: <MousePointer size={18} />, label: "ຈຸດ" },
      { type: "DrawLineString", icon: <LineIcon />, label: "ເສັ້ນ" },
      { type: "DrawPolygon", icon: <PolygonIcon />, label: "ພື້ນທີ່" },
      { type: "DrawCircle", icon: <Circle size={18} />, label: "ວົງມົນ" },
      {
        type: "DrawBox",
        icon: <RectangleHorizontal size={18} />,
        label: "ກ່ອງ",
      },
      { type: "Edit", icon: <Pencil size={18} />, label: "ແກ້ໄຂ" },
      { type: "MeasureLength", icon: <Ruler size={18} />, label: "ວັດແທກໄລຍະ" },
      {
        type: "MeasureArea",
        icon: <MeasureAreaIcon />,
        label: "ວັດແທກເນື້ອທີ່",
      },
    ];

    const advancedTools = [
      {
        type: "Cut",
        icon: <Scissors size={18} />,
        label: "ຕັດ",
        disabled: true,
      },
      {
        type: "Joint",
        icon: <GitMerge size={18} />,
        label: "ເຊື່ອມ",
        disabled: true,
      },
    ];

    const handleModeSelect = (type) => {
      const newMode = currentInteractionMode === type ? "None" : type;
      onSetInteractionMode(newMode);
    };

    const handleAdvancedToolClick = (tool) => {
      alert(`ເຄື່ອງມື '${tool.label}' ຍັງບໍ່ທັນເປີດໃຊ້ງານ.`);
      console.warn(`Advanced tool '${tool.type}' is not yet implemented.`);
    };

    return (
      <div
        ref={ref}
        className={`drawing-tools-floating ${isDragging ? "dragging" : ""}`}
        style={{ top: position.y, left: position.x }}
      >
        <div
          className="drag-handle"
          onMouseDown={handleMouseDown}
          title="ລາກເພື່ອຍ້າຍ"
        >
          <GripVertical size={20} />
        </div>
        <div className="drawing-buttons-grid">
          {mainTools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => handleModeSelect(tool.type)}
              className={`drawing-button ${
                currentInteractionMode === tool.type ? "active" : ""
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
          {advancedTools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => handleAdvancedToolClick(tool)}
              className="drawing-button"
              title={`${tool.label} (ຍັງບໍ່ເປີດໃຊ້)`}
              disabled={tool.disabled}
            >
              {tool.icon}
            </button>
          ))}
        </div>
        <div className="drawing-buttons-separator"></div>
        <div className="drawing-buttons-grid utility-group">
          <button
            onClick={onToggleSnap}
            className={`drawing-button snap-button ${
              isSnapActive ? "active" : ""
            }`}
            title={isSnapActive ? "ປິດໂໝດ Snap" : "ເປີດໂໝດ Snap"}
          >
            <Magnet size={18} />
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="drawing-button"
            title="ຍ້ອນກັບ"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="drawing-button"
            title="ເຮັດຊໍ້າ"
          >
            <Redo2 size={18} />
          </button>
          <button
            onClick={onSave}
            className="drawing-button utility-button"
            title="ບັນທຶກ"
          >
            <Save size={18} />
          </button>
          <button
            onClick={onClearDrawing}
            className="drawing-button clear-button"
            title="ລ້າງທັງໝົດ"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  }
);

export default DrawingToolbar;
