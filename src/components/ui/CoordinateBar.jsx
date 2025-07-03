import React, { useEffect, useState, useRef, useCallback } from "react"; // import hooks ທີ່ຈຳເປັນຈາກ React
import { toLonLat } from "ol/proj"; // import toLonLat ຈາກ OpenLayers ສຳລັບປ່ຽນ coordinate
import proj4 from "proj4"; // import proj4 ສຳລັບການປ່ຽນລະບົບພິກັດ UTM
import { unByKey } from "ol/Observable"; // import unByKey ຈາກ OpenLayers ສຳລັບການລຶບ event listener
import { MapPin, Copy, History, X, Compass, Trash2 } from "lucide-react"; // import icons ຕ່າງໆຈາກ lucide-react

// Helper functions for UTM conversion
const getUtmZone = (lon) => {
  // ຄິດໄລ່ UTM zone ຈາກຄ່າ longitude
  return Math.floor((lon + 180) / 6) + 1;
};

const getUtmProjString = (zone, isNorth) => {
  // ສ້າງ string định nghĩa projection ສຳລັບ UTM
  const hemi = isNorth ? "" : " +south"; // ກຳນົດ hemisphere (North/South)
  return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs${hemi}`;
};

const CoordinateBar = ({ map }) => {
  // ຮັບ map object ຈາກ props
  const [isPanelVisible, setIsPanelVisible] = useState(false); // state ສຳລັບຄວບຄຸມການເບິ່ງເຫັນຂອງ panel
  const [coords, setCoords] = useState({
    // state ສຳລັບເກັບຄ່າພິກັດປັດຈຸບັນ
    easting: null,
    northing: null,
    zone: null,
    hemi: null,
    lat: null,
    lon: null,
  });
  const [copySuccess, setCopySuccess] = useState(""); // state ສຳລັບສະແດງຂໍ້ຄວາມສຳເລັດການຄັດລອກ
  const [history, setHistory] = useState([]); // state ສຳລັບເກັບປະຫວັດພິກັດທີ່ຄລິກ
  const historyCounterRef = useRef(1); // useRef ເກັບ counter ສຳລັບລຳດັບໃນປະຫວັດ
  const panelRef = useRef(null); // useRef ເກັບ reference ຂອງ panel UI

  const handleClosePanel = () => {
    // function ສຳລັບປິດ panel
    setIsPanelVisible(false);
  };

  const formatCoords = useCallback((coordObj) => {
    // useCallback ເພື່ອ format ຄ່າ Lon/Lat
    if (!coordObj.lon || !coordObj.lat) return "N/A";
    return `Lon/Lat: ${coordObj.lon}, ${coordObj.lat}`;
  }, []);

  const copyToClipboard = useCallback(
    // useCallback ສຳລັບຄັດລອກ text ໄປທີ່ clipboard
    async (text) => {
      let message = "ຄັດລອກສຳເລັດ!";
      try {
        if (navigator.clipboard && window.isSecureContext) {
          // ໃຊ້ navigator.clipboard API ຖ້າຮອງຮັບ
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback ສຳລັບ browser ເກົ່າ ຫຼື ບໍ່ປອດໄພ
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
      } catch {
        message = "ຄັດລອກບໍ່ສຳເລັດ!";
      }
      setCopySuccess(message); // ສະແດງຂໍ້ຄວາມສຳເລັດ/ລົ້ມເຫຼວ
      setTimeout(() => setCopySuccess(""), 1500); // ລ້າງຂໍ້ຄວາມຫຼັງ 1.5 ວິນາທີ
    },
    []
  );

  const handleAddHistory = useCallback(() => {
    // useCallback ສຳລັບເພີ່ມພິກັດປັດຈຸບັນເຂົ້າໃນປະຫວັດ
    if (coords.lon !== null) {
      const newHistoryItem = {
        ...coords,
        id: Date.now(), // ID ທີ່ເປັນເອກະລັກ
        number: historyCounterRef.current, // ລຳດັບໃນປະຫວັດ
      };
      setHistory((prev) => [newHistoryItem, ...prev]); // ເພີ່ມລາຍການໃໝ່ເຂົ້າໄປໃນຕົ້ນ array
      historyCounterRef.current += 1; // ເພີ່ມ counter
      setCopySuccess("ພິກັດຖືກບັນທຶກແລ້ວ!");
      setTimeout(() => setCopySuccess(""), 1500);
    }
  }, [coords]); // Dependency: coords

  const handleClearHistory = () => {
    // function ສຳລັບລ້າງປະຫວັດທັງໝົດ
    setHistory([]); // ລ້າງ array ປະຫວັດ
    historyCounterRef.current = 1; // reset counter
  };

  useEffect(() => {
    // useEffect ສຳລັບຈັດການ pointermove event ໃນແຜນທີ່
    if (!map) return;
    const handlePointerMove = (evt) => {
      const lonLat = toLonLat(evt.coordinate); // ປ່ຽນ coordinate ຂອງ mouse ເປັນ Lon/Lat
      const lon = lonLat[0];
      const lat = lonLat[1];
      const zone = getUtmZone(lon); // ຄິດໄລ່ UTM zone
      const isNorth = lat >= 0; // ກວດສອບ hemisphere
      const utmProjDef = `EPSG:${isNorth ? "326" : "327"}${zone}`; // ສ້າງ definition string ສຳລັບ projection
      if (!proj4.defs[utmProjDef]) {
        proj4.defs(utmProjDef, getUtmProjString(zone, isNorth)); // ເພີ່ມ definition ຖ້າຍັງບໍ່ມີ
      }
      const [easting, northing] = proj4("EPSG:4326", utmProjDef, lonLat); // ປ່ຽນ Lon/Lat ເປັນ UTM
      setCoords({
        // update state ຂອງ coords
        easting: easting.toFixed(2),
        northing: northing.toFixed(2),
        zone,
        hemi: isNorth ? "N" : "S",
        lat: lat.toFixed(5),
        lon: lon.toFixed(5),
      });
    };
    const pointerMoveKey = map.on("pointermove", handlePointerMove); // ລົງທະບຽນ event listener
    return () => unByKey(pointerMoveKey); // cleanup function: ລຶບ event listener ເມື່ອ component unmount
  }, [map]); // Dependency: map

  useEffect(() => {
    // useEffect ສຳລັບຈັດການ click event ໃນແຜນທີ່
    if (!map) return;
    const handleMapClick = (evt) => {
      if (!isPanelVisible) return; // ຖ້າ panel ບໍ່ເຫັນ, ບໍ່ຕ້ອງເຮັດຫຍັງ
      if (
        panelRef.current &&
        panelRef.current.contains(evt.originalEvent.target)
      )
        return; // ຖ້າຄລິກພາຍໃນ panel, ບໍ່ຕ້ອງເຮັດຫຍັງ
      handleAddHistory(); // ເພີ່ມພິກັດເຂົ້າໃນປະຫວັດ
    };
    const clickKey = map.on("click", handleMapClick); // ລົງທະບຽນ event listener
    return () => unByKey(clickKey); // cleanup function: ລຶບ event listener ເມື່ອ component unmount
  }, [map, isPanelVisible, handleAddHistory]); // Dependencies: map, isPanelVisible, handleAddHistory

  const handleRemoveHistoryItem = (id) =>
    // function ສຳລັບລຶບລາຍການໃນປະຫວັດ
    setHistory((prev) => prev.filter((item) => item.id !== id));
  const handleCopyHistoryItem = (item) =>
    // function ສຳລັບຄັດລອກ Lon/Lat ຈາກລາຍການໃນປະຫວັດ
    copyToClipboard(formatCoords(item));
  const handleCopyUtmHistoryItem = (item) =>
    // function ສຳລັບຄັດລອກ UTM ຈາກລາຍການໃນປະຫວັດ
    copyToClipboard(
      `UTM Zone ${item.zone}${item.hemi}: ${item.easting}E, ${item.northing}N`
    );

  return (
    // ສ່ວນ UI ຂອງ component
    <div className="coordinate-widget-container">
      {copySuccess && <div className="copy-success-message">{copySuccess}</div>}{" "}
      {/* ສະແດງຂໍ້ຄວາມສຳເລັດການຄັດລອກ */}
      {!isPanelVisible ? ( // ຖ້າ panel ບໍ່ເຫັນ, ສະແດງປຸ່ມເປີດ
        <button
          onClick={() => setIsPanelVisible(true)} // ເມື່ອຄລິກ, ເປີດ panel
          className="coordinate-fab"
          title="ເປີດແຖບພິກັດ"
        >
          <Compass size={20} /> {/* icon Compass */}
        </button>
      ) : (
        // ຖ້າ panel ເຫັນ, ສະແດງ panel ເຕັມ
        <div ref={panelRef} className="coordinate-bar">
          <div className="coordinate-bar-header">
            <h3>Coordinate Tools</h3> {/* ຫົວຂໍ້ */}
            <button
              onClick={handleClosePanel} // ເມື່ອຄລິກ, ປິດ panel
              className="close-panel-button"
              title="ປິດ"
            >
              <X size={20} /> {/* icon X */}
            </button>
          </div>

          <div className="coordinate-details">
            <div className="current-coords-section">
              <h4>ພິກັດປັດຈຸບັນ</h4> {/* ຫົວຂໍ້: ພິກັດປັດຈຸບັນ */}
              <div className="coord-row">
                <span>
                  {coords.lon ? formatCoords(coords) : "ເລື່ອນເມົ້າເທິງແຜນທີ່"}{" "}
                  {/* ສະແດງ Lon/Lat ຫຼື ຂໍ້ຄວາມແນະນຳ */}
                </span>
                <button
                  onClick={() => copyToClipboard(formatCoords(coords))} // ຄັດລອກ Lon/Lat
                  title="ຄັດລອກ Lon/Lat"
                >
                  <Copy size={16} /> {/* icon Copy */}
                </button>
              </div>
              <div className="coord-row">
                <span>
                  {coords.easting
                    ? `UTM: ${coords.easting}E, ${coords.northing}N`
                    : "..."}{" "}
                  {/* ສະແດງ UTM ຫຼື "..." */}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `UTM Zone ${coords.zone}${coords.hemi}: ${coords.easting}E, ${coords.northing}N`
                    )
                  } // ຄັດລອກ UTM
                  title="ຄັດລອກ UTM"
                >
                  <Copy size={16} /> {/* icon Copy */}
                </button>
              </div>
              <div className="coord-row-small">
                <span>
                  {coords.zone ? `Zone ${coords.zone}${coords.hemi}` : ""}{" "}
                  {/* ສະແດງ UTM Zone */}
                </span>
              </div>
            </div>
            <div className="history-section">
              <div className="history-section-header">
                <h4>ປະຫວັດການຄລິກ</h4> {/* ຫົວຂໍ້: ປະຫວັດການຄລິກ */}
                {history.length > 0 && ( // ຖ້າມີປະຫວັດ, ສະແດງປຸ່ມລ້າງປະຫວັດ
                  <button
                    onClick={handleClearHistory} // ລ້າງປະຫວັດທັງໝົດ
                    className="clear-history-button"
                    title="ລ້າງປະຫວັດທັງໝົດ"
                  >
                    <Trash2 size={14} /> {/* icon Trash */}
                    <span>ລ້າງທັງໝົດ</span>
                  </button>
                )}
              </div>
              <div className="history-list">
                {history.length > 0 ? ( // ຖ້າມີປະຫວັດ, loop ສະແດງລາຍການ
                  history.map((item) => (
                    <div key={item.id} className="history-item">
                      <span className="history-item-number">
                        {item.number}.{/* ລຳດັບ */}
                      </span>
                      <div className="history-item-coords">
                        <span>{formatCoords(item)}</span>{" "}
                        {/* ສະແດງ Lon/Lat ຂອງລາຍການປະຫວັດ */}
                        <span className="history-item-utm">
                          UTM: {item.easting}E, ${item.northing}N{" "}
                          {/* ສະແດງ UTM ຂອງລາຍການປະຫວັດ */}
                        </span>
                      </div>
                      <div className="history-item-actions">
                        <button
                          onClick={() => handleCopyHistoryItem(item)}
                          title="ຄັດລອກ Lon/Lat"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleCopyUtmHistoryItem(item)}
                          title="ຄັດລອກ UTM"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleRemoveHistoryItem(item.id)}
                          className="remove-btn"
                          title="ລຶບ"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // ຖ້າບໍ່ມີປະຫວັດ
                  <div className="empty">ຄລິກເທິງແຜນທີ່ເພື່ອບັນທຶກພິກັດ</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinateBar; // export component
