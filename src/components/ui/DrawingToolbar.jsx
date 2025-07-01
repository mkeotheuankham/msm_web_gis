// src/components/ui/DrawingToolbar.jsx (Now a simple UI component)

import React from "react";
// Import icons...
import { MousePointer, Pencil, Magnet } from "lucide-react";

const DrawingToolbar = ({
  currentInteractionMode,
  onSetInteractionMode,
  isSnapActive,
  onToggleSnap,
  // onClear, onUndo, onRedo...
}) => {
  const mainTools = [
    { type: "DrawPoint", icon: <MousePointer size={16} />, label: "Point" },
    { type: "DrawPolygon", icon: "⬟", label: "Polygon" }, // Using text as placeholder
    { type: "Edit", icon: <Pencil size={16} />, label: "Edit" },
  ];

  return (
    <div className="drawing-toolbar-header">
      {mainTools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => onSetInteractionMode(tool.type)}
          className={`toolbar-button ${
            currentInteractionMode === tool.type ? "active" : ""
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
      <div className="toolbar-separator"></div>
      <button
        onClick={onToggleSnap}
        className={`toolbar-button ${isSnapActive ? "active" : ""}`}
        title="Toggle Snapping"
      >
        <Magnet size={16} />
      </button>
      {/* Add other buttons for Clear, Undo, Redo here */}
    </div>
  );
};

export default DrawingToolbar;
