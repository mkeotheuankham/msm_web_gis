import React, { useEffect, useState } from "react";
import { toLonLat } from "ol/proj";
import proj4 from "proj4";
import { MapPin } from "lucide-react"; // ນໍາເຂົ້າ MapPin ໄອຄອນ

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
    // ການນໍາໃຊ້ document.execCommand('copy') ເພື່ອຄັດລອກຂໍ້ຄວາມ
    const dummyElement = document.createElement("textarea");
    document.body.appendChild(dummyElement);
    dummyElement.value = text;
    dummyElement.select();
    document.execCommand("copy");
    document.body.removeChild(dummyElement);

    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 1500);
  };

  const copyHistoryEntry = (entry) => {
    const text = `UTM Zone ${entry.zone} E: ${entry.easting} N: ${entry.northing} | Lat: ${entry.lat} Lon: ${entry.lon}`;
    // ການນໍາໃຊ້ document.execCommand('copy') ເພື່ອຄັດລອກຂໍ້ຄວາມ
    const dummyElement = document.createElement("textarea");
    document.body.appendChild(dummyElement);
    dummyElement.value = text;
    dummyElement.select();
    document.execCommand("copy");
    document.body.removeChild(dummyElement);

    setCopySuccess("Copied history!");
    setTimeout(() => setCopySuccess(""), 1500);
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
          <MapPin size={20} /> {/* ປ່ຽນ 📍 ເປັນໄອຄອນ MapPin */}
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
                      e.stopPropagation(); // ຢຸດການແຜ່ກະຈາຍຂອງ event ເພື່ອບໍ່ໃຫ້ trigger handleCopy ຂອງແຜງ
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
                      e.stopPropagation(); // ຢຸດການແຜ່ກະຈາຍຂອງ event
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
          position: absolute;
          bottom: 0.5rem; /* ປັບໃຫ້ຢູ່ຕໍ່າລົງອີກໜ້ອຍໜຶ່ງ */
          right: 0.5rem; /* ປັບໃຫ້ຢູ່ຊິດຂວາອີກໜ້ອຍໜຶ່ງ */
          z-index: 1000;
          font-family: monospace;
          user-select: none;
        }
        .coordinate-toggle-btn {
          background: linear-gradient(145deg, rgba(30, 144, 255, 0.5), rgba(10, 100, 200, 0.5)); /* ໂປ່ງໃສຫຼາຍຂຶ້ນ */
          border: none;
          color: white;
          /* ປັບຂະໜາດ ແລະ padding ໃຫ້ເໝາະສົມກັບໄອຄອນ */
          font-size: 0; /* ປິດ font-size ຂອງປຸ່ມເອງ ເພື່ອໃຫ້ໄອຄອນຄວບຄຸມຂະໜາດ */
          padding: 8px 12px; /* ປັບ padding ໃຫ້ເໝາະສົມກັບໄອຄອນ */
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3); /* ເງົາອ່ອນລົງ */
          transition: all 0.3s ease;
          display: flex; /* ໃຊ້ flex ເພື່ອຈັດໄອຄອນໃຫ້ຢູ່ກາງ */
          align-items: center;
          justify-content: center;
        }
        .coordinate-toggle-btn:hover {
          background: linear-gradient(145deg, rgba(50, 164, 255, 0.6), rgba(30, 120, 220, 0.6)); /* ໂປ່ງໃສນ້ອຍລົງເມື່ອ hover */
          transform: translateY(-1px); /* ຍົກຂຶ້ນເລັກນ້ອຍ */
          box-shadow: 0 4px 10px rgba(0,0,0,0.4); /* ເງົາເຂັ້ມຂຶ້ນເມື່ອ hover */
        }
        .history-panel {
          margin-top: 8px; /* ຫຼຸດໄລຍະຫ່າງຈາກປຸ່ມ */
          width: 300px; /* ຂະໜາດນ້ອຍລົງ */
          max-height: 250px; /* ສູງນ້ອຍລົງ */
          background: rgba(20, 20, 20, 0.7); /* ໂປ່ງໃສຫຼາຍຂຶ້ນ */
          border-radius: 10px; /* ມົນນ້ອຍລົງ */
          padding: 12px 15px; /* ຫຼຸດ padding */
          color: #eee;
          font-size: 13px; /* ຂະໜາດ font ນ້ອຍລົງ */
          box-shadow: 0 4px 12px rgba(0,0,0,0.6); /* ເງົາອ່ອນລົງ */
          overflow-y: auto;
          cursor: default;
          user-select: text;
        }
        .current-coords {
          margin-bottom: 10px; /* ຫຼຸດ margin */
          padding-bottom: 6px; /* ຫຼຸດ padding */
          border-bottom: 1px solid rgba(255,255,255,0.05); /* ຂອບບາງໆໂປ່ງໃສຂຶ້ນ */
        }
        .current-coords strong {
          color: #b3e0ff; /* ສີຟ້າອ່ອນລົງ */
        }
        hr {
          border: none;
          border-top: 1px solid #3a3a3a; /* ສີເຂັ້ມຂຶ້ນເລັກນ້ອຍ */
          margin: 8px 0; /* ຫຼຸດ margin */
        }
        .history-list {
          max-height: 180px; /* ສູງນ້ອຍລົງ */
          overflow-y: auto;
        }
        .history-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px; /* ຫຼຸດ padding */
          border-bottom: 1px solid #2a2a2a; /* ສີເຂັ້ມຂຶ້ນເລັກນ້ອຍ */
          font-size: 12px; /* ຂະໜາດ font ນ້ອຍລົງ */
          background-color: rgba(255,255,255,0.02); /* ໂປ່ງໃສຫຼາຍຂຶ້ນ */
          border-radius: 5px; /* ມົນນ້ອຍລົງ */
          margin-bottom: 3px; /* ຫຼຸດ margin */
          transition: background-color 0.2s ease;
        }
        .history-entry:hover {
          background-color: rgba(255,255,255,0.06); /* ໂປ່ງໃສນ້ອຍລົງເມື່ອ hover */
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
          margin-right: 8px; /* ຫຼຸດ margin */
        }
        .coord-text:hover {
          color: #a0d9ff; /* ສີຟ້າອ່ອນລົງເມື່ອ hover */
        }
        .remove-btn {
          background: transparent;
          border: none;
          color: #ff8888; /* ສີແດງອ່ອນລົງ */
          font-weight: bold;
          cursor: pointer;
          font-size: 14px; /* ຂະໜາດນ້ອຍລົງ */
          padding: 0 4px; /* ຫຼຸດ padding */
          user-select: none;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .remove-btn:hover {
          color: #ff5555; /* ສີແດງເຂັ້ມຂຶ້ນເມື່ອ hover */
          transform: scale(1.05); /* ຂະຫຍາຍນ້ອຍລົງ */
        }
        .empty {
          text-align: center;
          color: #777; /* ສີເຂັ້ມຂຶ້ນເລັກນ້ອຍ */
          padding: 10px 0; /* ຫຼຸດ padding */
          font-style: italic;
        }
        .copy-status {
          margin-top: 5px; /* ຫຼຸດ margin */
          font-size: 11px; /* ຂະໜາດ font ນ້ອຍລົງ */
          color: #99ccff; /* ສີຟ້າອ່ອນລົງ */
          font-weight: bold;
          opacity: 0.9;
          pointer-events: none;
          user-select: none;
        }
        
        @media (max-width: 768px) {
            .coordinate-button-container {
                bottom: 0.25rem; /* ປັບຕໍາແໜ່ງສໍາລັບມືຖື */
                right: 0.25rem; /* ປັບຕໍາແໜ່ງສໍາລັບມືຖື */
            }
            .coordinate-toggle-btn {
                font-size: 18px; /* ນ້ອຍລົງອີກ */
                padding: 8px 12px; /* ຫຼຸດລົງອີກ */
            }
            .history-panel {
                width: calc(100vw - 1rem); /* ປັບຄວາມກວ້າງ */
                max-width: 280px; /* ຂະໜາດສູງສຸດນ້ອຍລົງ */
                padding: 10px 12px;
                margin-top: 5px;
            }
        }
      `}</style>
    </>
  );
};

export default CoordinateBar;
