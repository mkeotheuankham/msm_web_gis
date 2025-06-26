import React from "react";

const HistoryToggleButton = ({ isOpen, toggle }) => {
  return (
    <button
      className="history-toggle"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      title="Toggle history panel"
      aria-pressed={isOpen}
    >
      📋
    </button>
  );
};

export default HistoryToggleButton;
