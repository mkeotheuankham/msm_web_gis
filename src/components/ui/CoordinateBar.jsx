import React, { useEffect, useState, useRef } from "react";
import { toLonLat } from "ol/proj";
import proj4 from "proj4";
import { MapPin, Copy, Plus, History, X } from "lucide-react"; // ນໍາເຂົ້າ icons ທີ່ຕ້ອງການ

// ກຳນົດ proj4 definition ສຳລັບ EPSG:32648 (UTM Zone 48N)
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
  const [showFullBar, setShowFullBar] = useState(false); // State ໃໝ່ເພື່ອຄວບຄຸມການສະແດງແຖບເຕັມ

  const barRef = useRef(null); // Ref for the main bar container

  // Function to format coordinates for display/copy
  const formatCoords = (coordObj) => {
    return `Lon/Lat: ${coordObj.lon}, ${coordObj.lat} | UTM: ${coordObj.easting}E, ${coordObj.northing}N (${coordObj.zone})`;
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopySuccess("ຄັດລອກສຳເລັດ!");
      setTimeout(() => setCopySuccess(""), 1500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopySuccess("ຄັດລອກບໍ່ສຳເລັດ!");
      setTimeout(() => setCopySuccess(""), 1500);
    }
  };

  // Live coordinate update on map pointermove
  useEffect(() => {
    if (!map) return;

    const handlePointerMove = (evt) => {
      const lonLat = toLonLat(evt.coordinate);
      let easting = null;
      let northing = null;

      try {
        [easting, northing] = proj4("EPSG:4326", "EPSG:32648", lonLat);
      } catch (error) {
        console.error("Proj4 transformation error:", error);
      }

      setCoords({
        easting: easting !== null ? easting.toFixed(2) : "N/A",
        northing: northing !== null ? northing.toFixed(2) : "N/A",
        zone: "48N",
        lat: lonLat[1].toFixed(6),
        lon: lonLat[0].toFixed(6),
      });
    };

    map.on("pointermove", handlePointerMove);

    return () => {
      map.un("pointermove", handlePointerMove);
    };
  }, [map]);

  // Save current coordinates to history on map click
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (evt) => {
      // Check if the click happened on the coordinate bar itself
      if (barRef.current && barRef.current.contains(evt.originalEvent.target)) {
        return; // Ignore clicks inside the coordinate bar
      }

      const lonLat = toLonLat(evt.coordinate);
      let easting = null;
      let northing = null;
      try {
        [easting, northing] = proj4("EPSG:4326", "EPSG:32648", lonLat);
      } catch (error) {
        console.error("Proj4 transformation error on click:", error);
      }

      const coordsToSave = {
        easting: easting !== null ? easting.toFixed(2) : "N/A",
        northing: northing !== null ? northing.toFixed(2) : "N/A",
        zone: "48N",
        lat: lonLat[1].toFixed(6),
        lon: lonLat[0].toFixed(6),
      };

      const coordsString = formatCoords(coordsToSave);

      setHistory((prevHistory) => {
        const newHistory = [
          { id: Date.now(), text: coordsString, coords: coordsToSave },
          ...prevHistory,
        ];
        return newHistory.slice(0, 5); // ເກັບສູງສຸດ 5 ລາຍການ
      });
      setCopySuccess("ພິກັດຖືກບັນທຶກ!"); // User feedback
      setTimeout(() => setCopySuccess(""), 1500);
    };

    map.on("click", handleMapClick); // Listen for click events on the map

    return () => {
      map.un("click", handleMapClick);
    };
  }, [map]); // Dependency on 'map'

  const handleRemoveHistoryItem = (id) => {
    setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
  };

  const handleCopyHistoryItem = (item) => {
    copyToClipboard(item.text);
  };

  return (
    <>
      <style>
        {`
        /* Coordinate Bar Wrapper */
        .coordinate-bar-wrapper {
            position: absolute;
            bottom: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            align-items: flex-end; /* Align button to the right in collapsed state */
            transition: all 0.3s ease;
            pointer-events: auto; /* Allow interaction with the bar itself */
            overflow: hidden; /* Hide overflow when collapsing/expanding */
        }

        .coordinate-bar-wrapper.collapsed {
            width: 50px; /* Width for icon only */
            height: 50px; /* Height for icon only */
            padding: 8px; /* Padding for the icon button */
            align-items: center; /* Center icon when collapsed */
            justify-content: center; /* Center icon when collapsed */
        }

        .coordinate-bar-wrapper.expanded {
            width: 250px; /* Expanded width */
            height: auto; /* Auto height for content */
            align-items: stretch; /* Stretch content */
            padding: 10px 15px; /* Expanded padding */
        }

        /* Toggle Button */
        .coordinate-toggle-button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            width: 34px; /* Icon size approx */
            height: 34px; /* Icon size approx */
            border-radius: 50%;
            transition: all 0.2s ease;
            flex-shrink: 0; /* Prevent shrinking */
        }
        .coordinate-toggle-button .toggle-text {
            font-size: 14px;
            margin-left: 5px;
            opacity: 1; /* Visible when expanded */
            transition: opacity 0.2s ease;
        }

        .coordinate-bar-wrapper.collapsed .coordinate-toggle-button .toggle-text {
            opacity: 0; /* Hidden when collapsed */
            width: 0; /* Collapse width */
            overflow: hidden;
            margin-left: 0; /* Remove margin when hidden */
        }

        /* Content Area (hidden when collapsed, shown when expanded) */
        .coordinate-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 8px; /* Space between toggle button and content */
            width: 100%;
            opacity: 1;
            transition: opacity 0.3s ease;
        }

        .coordinate-bar-wrapper.collapsed .coordinate-content {
            opacity: 0;
            height: 0; /* Collapse height */
            overflow: hidden;
            margin-top: 0; /* Remove margin when hidden */
        }

        /* Coordinate Display */
        .coordinate-display {
            background: rgba(255, 255, 255, 0.1);
            padding: 8px;
            border-radius: 4px;
            font-size: 13px;
            color: white;
            pointer-events: none; /* Allow events to pass through text */
        }
        .coordinate-display p {
            margin: 2px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Coordinate Actions */
        .coordinate-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .coordinate-actions button {
            background: #007bff;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.2s ease, transform 0.2s ease;
            font-size: 12px;
            flex: 1;
            min-width: fit-content;
            pointer-events: auto; /* Enable clicks on buttons */
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }
        .coordinate-actions button:hover { background: #0056b3; transform: translateY(-1px); }
        .coordinate-actions button:disabled { background: #555; cursor: not-allowed; }

        /* Copy Status */
        .copy-status {
            font-size: 11px;
            color: #99ccff;
            text-align: center;
            margin-top: 5px;
            pointer-events: none; /* Status should not be clickable */
        }

        /* Coordinate History Panel */
        .coordinate-history-panel {
            background: rgba(0, 0, 0, 0.85);
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: auto;
        }
        .coordinate-history-panel .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        .coordinate-history-panel .history-header h4 {
            margin: 0;
            font-size: 1.1rem;
            color: #a0a0a0;
        }
        .coordinate-history-panel .close-history-btn {
            background: transparent;
            border: none;
            color: #ff5555;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 2px 5px;
            border-radius: 3px;
            transition: background 0.2s ease;
            pointer-events: auto;
        }
        .coordinate-history-panel .close-history-btn:hover {
            background: rgba(255, 0, 0, 0.2);
        }
        .coordinate-history-panel .history-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .coordinate-history-panel .history-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 8px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            word-break: break-all;
        }
        .coordinate-history-panel .history-item span {
            flex-grow: 1;
            padding-right: 10px;
            pointer-events: none;
        }
        .coordinate-history-panel .history-item-actions {
            display: flex;
            gap: 5px;
            flex-shrink: 0;
        }
        .coordinate-history-panel .history-item button {
            background: #337ab7;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s ease;
            font-size: 0.75rem;
            pointer-events: auto;
        }
        .coordinate-history-panel .history-item button.remove-btn {
            background: #d9534f;
        }
        .coordinate-history-panel .history-item button:hover {
            background: #286090;
        }
        .coordinate-history-panel .history-item button.remove-btn:hover {
            background: #c9302c;
        }
        .coordinate-history-panel .empty {
            text-align: center;
            color: #a0a0a0;
            font-style: italic;
            font-size: 0.9rem;
        }

        /* Responsive Mobile adjustments */
        @media (max-width: 768px) {
            .coordinate-bar-wrapper.collapsed {
                bottom: 5px;
                right: 5px;
                width: 50px;
                height: 50px;
                padding: 8px;
            }
            .coordinate-bar-wrapper.expanded {
                bottom: 5px;
                right: 5px;
                left: 5px; /* Expand across mobile width */
                width: auto; /* Adjust width for mobile */
                max-width: calc(100% - 10px);
                padding: 10px;
                flex-direction: column; /* Stack content vertically */
            }
            .coordinate-content {
                margin-top: 5px; /* Smaller gap on mobile */
            }
            .coordinate-display p {
                font-size: 12px;
            }
            .coordinate-actions button {
                font-size: 11px;
                padding: 5px 8px;
            }
            .coordinate-history-panel {
                margin-top: 5px;
                max-height: 150px;
            }
        }
        `}
      </style>

      <div
        ref={barRef}
        className={`coordinate-bar-wrapper ${
          showFullBar ? "expanded" : "collapsed"
        }`}
      >
        <button
          className="coordinate-toggle-button"
          onClick={() => setShowFullBar(!showFullBar)}
          title={showFullBar ? "ເຊື່ອງແຖບພິກັດ" : "ສະແດງແຖບພິກັດ"}
        >
          <MapPin size={24} />
          {showFullBar && <span className="toggle-text">ປິດ</span>}
        </button>

        {showFullBar && (
          <div className="coordinate-content">
            <div className="coordinate-display">
              {coords.lon !== null && coords.lat !== null ? (
                <>
                  <p>
                    <strong>Lon/Lat:</strong> {coords.lon}, {coords.lat}
                  </p>
                  <p>
                    <strong>UTM:</strong> {coords.easting}E, {coords.northing}N
                    ({coords.zone})
                  </p>
                </>
              ) : (
                <p>ຍ້າຍເມົ້າສ໌ໄປເທິງແຜນທີ່</p>
              )}
            </div>
            <div className="coordinate-actions">
              <button
                onClick={() => copyToClipboard(formatCoords(coords))}
                disabled={coords.lon === null}
              >
                <Copy size={16} /> ຄັດລອກ
              </button>
              <button onClick={() => setShowHistory(!showHistory)}>
                <History size={16} />{" "}
                {showHistory ? "ເຊື່ອງປະຫວັດ" : "ສະແດງປະຫວັດ"}
              </button>
            </div>
            {copySuccess && <span className="copy-status">{copySuccess}</span>}

            {showHistory && (
              <div className="coordinate-history-panel">
                <div className="history-header">
                  <h4>ປະຫວັດພິກັດ</h4>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="close-history-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="history-list">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <div key={item.id} className="history-item">
                        <span>{item.text}</span>
                        <div className="history-item-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyHistoryItem(item);
                            }}
                            className="copy-btn"
                          >
                            <Copy size={14} /> ຄັດລອກ
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveHistoryItem(item.id);
                            }}
                            className="remove-btn"
                          >
                            <X size={14} /> ລຶບ
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty">ບໍ່ມີປະຫວັດ.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CoordinateBar;
