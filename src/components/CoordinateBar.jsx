import React, { useEffect, useState } from "react";
import { toLonLat } from "ol/proj";
import proj4 from "proj4";
import HistoryToggleButton from "./HistoryToggleButton";

proj4.defs("EPSG:32648", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs");

const CoordinateBar = ({ map }) => {
  const [coords, setCoords] = useState({
    easting: null,
    northing: null,
    zone: "48N",
    lat: null,
    lon: null,
  });
  const [copySuccess, setCopySuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!map) return;

    const handlePointerMove = (evt) => {
      const lonLat = toLonLat(evt.coordinate);
      const [easting, northing] = proj4("EPSG:4326", "EPSG:32648", lonLat);
      setCoords({
        easting: easting.toFixed(2),
        northing: northing.toFixed(2),
        zone: "48N",
        lat: lonLat[1].toFixed(6),
        lon: lonLat[0].toFixed(6),
      });
    };

    const handleMapClick = (evt) => {
      const lonLat = toLonLat(evt.coordinate);
      const [easting, northing] = proj4("EPSG:4326", "EPSG:32648", lonLat);
      const newEntry = {
        id: Date.now(),
        lat: lonLat[1].toFixed(6),
        lon: lonLat[0].toFixed(6),
        easting: easting.toFixed(2),
        northing: northing.toFixed(2),
        zone: "48N",
      };
      setHistory((prev) => [newEntry, ...prev]);
    };

    map.on("pointermove", handlePointerMove);
    map.on("click", handleMapClick);

    return () => {
      map.un("pointermove", handlePointerMove);
      map.un("click", handleMapClick);
    };
  }, [map]);

  const handleCopy = () => {
    const text = `UTM Zone ${coords.zone} E: ${coords.easting} N: ${coords.northing} | Lat: ${coords.lat} Lon: ${coords.lon}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 1500);
    });
  };

  const copyHistoryEntry = (entry) => {
    const text = `UTM Zone ${entry.zone} E: ${entry.easting} N: ${entry.northing} | Lat: ${entry.lat} Lon: ${entry.lon}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess("Copied history!");
      setTimeout(() => setCopySuccess(""), 1500);
    });
  };

  const removeHistoryEntry = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className="coordinate-button-container">
        <button
          className="coordinate-toggle-btn"
          onClick={() => setShowHistory((v) => !v)}
          title="Toggle coordinate info"
        >
          📍
        </button>

        {showHistory && (
          <div
            className="history-panel"
            onClick={handleCopy}
            title="Click current coords to copy"
          >
            <div className="current-coords">
              <strong>Current Coordinates:</strong>
              <div>
                UTM Zone {coords.zone} E: {coords.easting} N: {coords.northing}
              </div>
              <div>
                Lat: {coords.lat} Lon: {coords.lon}
              </div>
              <div className="copy-status">{copySuccess}</div>
            </div>

            <hr />

            <div
              className="history-list"
              title="Click coord to copy, × to remove"
            >
              {history.length === 0 && (
                <div className="empty">No history yet.</div>
              )}
              {history.map((entry) => (
                <div key={entry.id} className="history-entry">
                  <div
                    className="coord-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyHistoryEntry(entry);
                    }}
                    title="Click to copy this coordinate"
                  >
                    UTM {entry.zone} E:{entry.easting} N:{entry.northing} | Lat:{" "}
                    {entry.lat} Lon: {entry.lon}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHistoryEntry(entry.id);
                    }}
                    title="Remove this entry"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .coordinate-button-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          font-family: monospace;
          user-select: none;
        }
        .coordinate-toggle-btn {
          background: rgba(30, 144, 255, 0.85);
          border: none;
          color: white;
          font-size: 26px;
          padding: 14px 18px;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          transition: background-color 0.3s ease;
        }
        .coordinate-toggle-btn:hover {
          background: rgba(30, 144, 255, 1);
        }
        .history-panel {
          margin-top: 10px;
          width: 360px;
          max-height: 350px;
          background: rgba(20, 20, 20, 0.9);
          border-radius: 10px;
          padding: 14px 18px;
          color: #eee;
          font-size: 13px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.7);
          overflow-y: auto;
          cursor: default;
          user-select: text;
        }
        .current-coords {
          margin-bottom: 12px;
        }
        hr {
          border: none;
          border-top: 1px solid #444;
          margin: 8px 0;
        }
        .history-list {
          max-height: 220px;
          overflow-y: auto;
        }
        .history-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-bottom: 1px solid #333;
          font-size: 12px;
        }
        .history-entry:last-child {
          border-bottom: none;
        }
        .coord-text {
          flex: 1;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 8px;
        }
        .coord-text:hover {
          color: #1e90ff;
        }
        .remove-btn {
          background: transparent;
          border: none;
          color: #cc4444;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
          padding: 0 4px;
          user-select: none;
        }
        .remove-btn:hover {
          color: #ff6666;
        }
        .empty {
          text-align: center;
          color: #888;
          padding: 12px 0;
          font-style: italic;
        }
        .copy-status {
          margin-top: 6px;
          font-size: 11px;
          color: #1e90ff;
          font-weight: bold;
          opacity: 0.8;
          pointer-events: none;
          user-select: none;
        }
      `}</style>
    </>
  );
};

export default CoordinateBar;
