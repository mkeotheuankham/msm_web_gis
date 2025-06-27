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

    map.on("pointermove", handlePointerMove);

    return () => {
      map.un("pointermove", handlePointerMove);
    };
  }, [map]);

  const formatCoords = (coordObj) => {
    return `E: ${coordObj.easting} N: ${coordObj.northing} (UTM ${coordObj.zone}) | Lat: ${coordObj.lat} Lon: ${coordObj.lon}`;
  };

  const handleCopyCoords = () => {
    const coordsString = formatCoords(coords);
    try {
      // Using document.execCommand('copy') as navigator.clipboard.writeText() might not work in some environments (e.g., iframes).
      const tempTextArea = document.createElement("textarea");
      tempTextArea.value = coordsString;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand("copy");
      document.body.removeChild(tempTextArea);
      setCopySuccess("ຄັດລອກສຳເລັດ!");
      setTimeout(() => setCopySuccess(""), 2000); // ລ້າງຂໍ້ຄວາມຫຼັງ 2 ວິນາທີ

      // ເພີ່ມເຂົ້າໃນປະຫວັດ
      setHistory((prevHistory) => {
        const newHistory = [
          { id: Date.now(), text: coordsString },
          ...prevHistory,
        ];
        return newHistory.slice(0, 5); // ເກັບສູງສຸດ 5 ລາຍການ
      });
    } catch (err) {
      setCopySuccess("ຄັດລອກບໍ່ສຳເລັດ!");
      console.error("Failed to copy coordinates: ", err);
    }
  };

  const handleCopyHistoryItem = (itemText) => {
    try {
      const tempTextArea = document.createElement("textarea");
      tempTextArea.value = itemText;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand("copy");
      document.body.removeChild(tempTextArea);
      setCopySuccess("ຄັດລອກສຳເລັດ!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      setCopySuccess("ຄັດລອກບໍ່ສຳເລັດ!");
      console.error("Failed to copy history item: ", err);
    }
  };

  const handleRemoveHistoryItem = (id) => {
    setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
  };

  return (
    <>
      <div
        className="coordinate-button-container"
        onClick={handleCopyCoords}
        title="ຄລິກເພື່ອຄັດລອກພິກັດ"
      >
        <MapPin size={20} />
        <span className="coordinate-display">
          {coords.easting !== null
            ? `E: ${coords.easting} N: ${coords.northing} (UTM ${coords.zone})`
            : "ເລື່ອນເມົ້າເທິງແຜນທີ່"}
        </span>
        {copySuccess && <div className="copy-status">{copySuccess}</div>}
      </div>

      <div
        className="coordinate-button-container"
        style={{ bottom: "60px", right: "10px" }}
        onClick={() => setShowHistory(!showHistory)}
        title="ສະແດງ/ເຊື່ອງປະຫວັດພິກັດ"
      >
        <MapPin size={20} />
        <span className="coordinate-display">ປະຫວັດພິກັດ</span>
      </div>

      {showHistory && (
        <div className="coordinate-history-panel">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="history-item">
                <span>{item.text}</span>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHistoryItem(item.text);
                    }}
                    className="copy-btn"
                  >
                    ຄັດລອກ
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveHistoryItem(item.id);
                    }}
                    className="remove-btn"
                  >
                    x
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">ບໍ່ມີປະຫວັດ.</div>
          )}
        </div>
      )}
    </>
  );
};

export default CoordinateBar;
