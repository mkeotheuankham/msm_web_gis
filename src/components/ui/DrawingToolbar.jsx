// src/components/ui/DrawingToolbar.jsx (Now a simple UI component)

import React from "react"; // import React
// Import icons...
import { MousePointer, Pencil, Magnet } from "lucide-react"; // import icons ຈາກ lucide-react

const DrawingToolbar = ({
  currentInteractionMode, // ໂໝດການໂຕ້ຕອບປັດຈຸບັນ (ເຊັ່ນ: DrawPoint, DrawPolygon, Edit)
  onSetInteractionMode, // callback function ເພື່ອຕັ້ງໂໝດການໂຕ້ຕອບ
  isSnapActive, // boolean ທີ່ບອກວ່າ snapping ຖືກເປີດໃຊ້ງານຢູ່ບໍ່
  onToggleSnap, // callback function ເພື່ອສະຫຼັບ snapping
  // onClear, onUndo, onRedo... // (comments) functions ສໍາລັບ clear, undo, redo
}) => {
  const mainTools = [
    // array ຂອງເຄື່ອງມືຫຼັກ
    { type: "DrawPoint", icon: <MousePointer size={16} />, label: "Point" }, // ເຄື່ອງມືສ້າງຈຸດ
    { type: "DrawPolygon", icon: "⬟", label: "Polygon" }, // ເຄື່ອງມືສ້າງ Polygon (ໃຊ້ text ເປັນ placeholder)
    { type: "Edit", icon: <Pencil size={16} />, label: "Edit" }, // ເຄື່ອງມືແກ້ໄຂ
  ];

  return (
    // ສ່ວນ UI ຂອງ toolbar
    <div className="drawing-toolbar-header">
      {mainTools.map((tool) => (
        // loop ຜ່ານ mainTools ເພື່ອສະແດງປຸ່ມ
        <button
          key={tool.type} // key ທີ່ເປັນເອກະລັກ
          onClick={() => onSetInteractionMode(tool.type)} // ເມື່ອຄລິກ, ຕັ້ງໂໝດການໂຕ້ຕອບ
          className={`toolbar-button ${
            currentInteractionMode === tool.type ? "active" : ""
          }`} // ເພີ່ມ class "active" ຖ້າເປັນໂໝດປັດຈຸບັນ
          title={tool.label} // tooltip ສະແດງຊື່ເຄື່ອງມື
        >
          {tool.icon} {/* ສະແດງ icon ຂອງເຄື່ອງມື */}
        </button>
      ))}
      <div className="toolbar-separator"></div> {/* ຕົວແຍກລະຫວ່າງປຸ່ມ */}
      <button
        onClick={onToggleSnap} // ເມື່ອຄລິກ, ສະຫຼັບ snapping
        className={`toolbar-button ${isSnapActive ? "active" : ""}`} // ເພີ່ມ class "active" ຖ້າ snapping ເປີດຢູ່
        title="Toggle Snapping" // tooltip
      >
        <Magnet size={16} /> {/* icon Magnet */}
      </button>
      {/* Add other buttons for Clear, Undo, Redo here */}
    </div>
  );
};

export default DrawingToolbar; // export component
