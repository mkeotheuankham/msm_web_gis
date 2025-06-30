import React, { useEffect, useState, useRef, useCallback } from "react";
import { toLonLat } from "ol/proj";
import proj4 from "proj4";
import { unByKey } from "ol/Observable";
import Snap from "ol/interaction/Snap";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {
  MapPin,
  Copy,
  History,
  X,
  Compass,
  Trash2,
  Magnet,
} from "lucide-react";

// Helper functions for UTM conversion
const getUtmZone = (lon) => {
  return Math.floor((lon + 180) / 6) + 1;
};

const getUtmProjString = (zone, isNorth) => {
  const hemi = isNorth ? "" : " +south";
  return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs${hemi}`;
};

const CoordinateBar = ({ map, parcelLoadedFeaturesCount, layerStates }) => {
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isSnapActive, setIsSnapActive] = useState(false);
  const [coords, setCoords] = useState({
    easting: null,
    northing: null,
    zone: null,
    hemi: null,
    lat: null,
    lon: null,
  });
  const [copySuccess, setCopySuccess] = useState("");
  const [history, setHistory] = useState([]);

  const historyCounterRef = useRef(1);
  const panelRef = useRef(null);
  const snapInteractionRef = useRef(null);
  const snapSourceRef = useRef(new VectorSource()); // Dedicated source for snapping

  const handleClosePanel = () => {
    setIsPanelVisible(false);
    setIsSnapActive(false);
  };

  const formatCoords = useCallback((coordObj) => {
    if (!coordObj.lon || !coordObj.lat) return "N/A";
    return `Lon/Lat: ${coordObj.lon}, ${coordObj.lat}`;
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    let message = "ຄັດລອກສຳເລັດ!";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
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
    setCopySuccess(message);
    setTimeout(() => setCopySuccess(""), 1500);
  }, []);

  const handleAddHistory = useCallback(() => {
    if (coords.lon !== null) {
      const newHistoryItem = {
        ...coords,
        id: Date.now(),
        number: historyCounterRef.current,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
      historyCounterRef.current += 1;
      setCopySuccess("ພິກັດຖືກບັນທຶກແລ້ວ!");
      setTimeout(() => setCopySuccess(""), 1500);
    }
  }, [coords]);

  const handleClearHistory = () => {
    setHistory([]);
    historyCounterRef.current = 1;
  };

  // --- REVISED and FINAL useEffect for managing Snap interaction ---
  useEffect(() => {
    if (!map) return;

    // Always remove the old snap interaction first to ensure a clean state
    if (snapInteractionRef.current) {
      map.removeInteraction(snapInteractionRef.current);
      snapInteractionRef.current = null;
    }

    if (isSnapActive) {
      console.log("Snap Mode ON. Re-populating snap source.");

      // Clear the dedicated snap source before adding new features
      snapSourceRef.current.clear();

      // Find all features from all vector layers and add them to our dedicated source
      const allLayers = map.getLayers().getArray();
      for (const layer of allLayers) {
        if (layer instanceof VectorLayer) {
          const source = layer.getSource();
          if (source && typeof source.getFeatures === "function") {
            const features = source.getFeatures();
            if (features.length > 0) {
              snapSourceRef.current.addFeatures(features);
            }
          }
        }
      }

      console.log(
        `Snap source now contains ${
          snapSourceRef.current.getFeatures().length
        } features.`
      );

      if (snapSourceRef.current.getFeatures().length > 0) {
        const newSnap = new Snap({
          source: snapSourceRef.current, // Use our dedicated, populated source
          pixelTolerance: 20, // A larger tolerance for easier snapping
        });

        map.addInteraction(newSnap);
        snapInteractionRef.current = newSnap;
      } else {
        console.warn(
          "Snap active, but no features were available to populate the snap source."
        );
      }
    }
  }, [map, isSnapActive, parcelLoadedFeaturesCount, layerStates]); // Re-run when snap is toggled or features change

  useEffect(() => {
    if (!map) return;
    const handlePointerMove = (evt) => {
      const lonLat = toLonLat(evt.coordinate);
      const lon = lonLat[0];
      const lat = lonLat[1];
      const zone = getUtmZone(lon);
      const isNorth = lat >= 0;
      const utmProjDef = `EPSG:${isNorth ? "326" : "327"}${zone}`;
      if (!proj4.defs[utmProjDef]) {
        proj4.defs(utmProjDef, getUtmProjString(zone, isNorth));
      }
      const [easting, northing] = proj4("EPSG:4326", utmProjDef, lonLat);
      setCoords({
        easting: easting.toFixed(2),
        northing: northing.toFixed(2),
        zone,
        hemi: isNorth ? "N" : "S",
        lat: lat.toFixed(5),
        lon: lon.toFixed(5),
      });
    };
    const pointerMoveKey = map.on("pointermove", handlePointerMove);
    return () => unByKey(pointerMoveKey);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const handleMapClick = (evt) => {
      if (!isPanelVisible) return;
      if (
        panelRef.current &&
        panelRef.current.contains(evt.originalEvent.target)
      )
        return;
      handleAddHistory();
    };
    const clickKey = map.on("click", handleMapClick);
    return () => unByKey(clickKey);
  }, [map, isPanelVisible, handleAddHistory]);

  const handleRemoveHistoryItem = (id) =>
    setHistory((prev) => prev.filter((item) => item.id !== id));
  const handleCopyHistoryItem = (item) => copyToClipboard(formatCoords(item));
  const handleCopyUtmHistoryItem = (item) =>
    copyToClipboard(
      `UTM Zone ${item.zone}${item.hemi}: ${item.easting}E, ${item.northing}N`
    );

  return (
    <div className="coordinate-widget-container">
      {copySuccess && <div className="copy-success-message">{copySuccess}</div>}

      {!isPanelVisible ? (
        <button
          onClick={() => setIsPanelVisible(true)}
          className="coordinate-fab"
          title="ເປີດແຖບພິກັດ"
        >
          <Compass size={28} />
        </button>
      ) : (
        <div ref={panelRef} className="coordinate-bar">
          <div className="coordinate-bar-header">
            <h3>Coordinate Tools</h3>
            <button
              onClick={() => setIsSnapActive((prev) => !prev)}
              className={`snap-toggle-button ${isSnapActive ? "active" : ""}`}
              title={isSnapActive ? "ປິດໂໝດ Snap" : "ເປີດໂໝດ Snap"}
            >
              <Magnet size={14} />
              <span>{isSnapActive ? "Snap ON" : "Snap OFF"}</span>
            </button>
            <button
              onClick={handleClosePanel}
              className="close-panel-button"
              title="ປິດ"
            >
              <X size={20} />
            </button>
          </div>

          <div className="coordinate-details">
            <div className="current-coords-section">
              <h4>ພິກັດປັດຈຸບັນ</h4>
              <div className="coord-row">
                <span>
                  {coords.lon ? formatCoords(coords) : "ເລື່ອນເມົ້າເທິງແຜນທີ່"}
                </span>
                <button
                  onClick={() => copyToClipboard(formatCoords(coords))}
                  title="ຄັດລອກ Lon/Lat"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="coord-row">
                <span>
                  {coords.easting
                    ? `UTM: ${coords.easting}E, ${coords.northing}N`
                    : "..."}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `UTM Zone ${coords.zone}${coords.hemi}: ${coords.easting}E, ${coords.northing}N`
                    )
                  }
                  title="ຄັດລອກ UTM"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="coord-row-small">
                <span>
                  {coords.zone ? `Zone ${coords.zone}${coords.hemi}` : ""}
                </span>
              </div>
            </div>
            <div className="history-section">
              <div className="history-section-header">
                <h4>ປະຫວັດການຄລິກ</h4>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="clear-history-button"
                    title="ລ້າງປະຫວັດທັງໝົດ"
                  >
                    <Trash2 size={14} />
                    <span>ລ້າງທັງໝົດ</span>
                  </button>
                )}
              </div>
              <div className="history-list">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div key={item.id} className="history-item">
                      <span className="history-item-number">
                        {item.number}.
                      </span>
                      <div className="history-item-coords">
                        <span>{formatCoords(item)}</span>
                        <span className="history-item-utm">
                          UTM: {item.easting}E, {item.northing}N
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

export default CoordinateBar;
