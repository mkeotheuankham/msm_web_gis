import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj"; // ຍັງຄົງນຳໃຊ້ fromLonLat, toLonLat
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";
import { defaults as defaultControls } from "ol/control"; // ນຳເຂົ້າ defaultControls ເພື່ອປັບແຕ່ງ

// Components ຂອງທ່ານ (ດຽວນີ້ຖືກນຳເຂົ້າຈາກໂຟນເດີ components)
import ProvinceControls from "./components/ProvinceControls";
import DrawingToolbar from "./components/DrawingToolbar";
import { PanelLeft, PanelRight } from "lucide-react"; // ນຳເຂົ້າໄອຄອນສຳລັບປຸ່ມ Toggle Sidebar

function App() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const drawInteractionRef = useRef(null);
  const draggableToolbarRef = useRef(null);

  const [centerState, setCenterState] = useState([102.3, 17.97]);
  const [zoomState, setZoomState] = useState(10);
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);
  const [activeDrawType, setActiveDrawType] = useState("None");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // ປ່ຽນຄ່າເລີ່ມຕົ້ນເປັນ true ເພື່ອໃຫ້ Sidebar ຖືກຫຍໍ້ໃນຕອນຕົ້ນ

  const [toolbarPosition, setToolbarPosition] = useState({ x: 50, y: "50%" });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Effect ສໍາລັບການເລີ່ມຕົ້ນ Map ແລະເພີ່ມ Layer ການແຕ້ມ
  useEffect(() => {
    if (mapRef.current) {
      const drawStyle = new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ffcc33",
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "#ffcc33",
          }),
        }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSourceRef.current,
        style: drawStyle,
        properties: { name: "drawingLayer" },
      });

      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer,
        ],
        view: new View({
          center: fromLonLat(centerState),
          zoom: zoomState,
        }),
        // ລຶບ Attribution Control, Rotate Control (Compass) ແລະ Zoom Control ອອກ
        controls: defaultControls({
          attribution: false,
          rotate: false,
          zoom: false,
        }).extend([]),
      });

      mapInstanceRef.current = map;
      setOpenLayersLoadedState(true);

      map.on("moveend", () => {
        const view = map.getView();
        const newCenter = toLonLat(view.getCenter());
        const newZoom = view.getZoom();
        setCenterState([
          parseFloat(newCenter[0].toFixed(2)),
          parseFloat(newCenter[1].toFixed(2)),
        ]);
        setZoomState(parseFloat(newZoom.toFixed(2)));
      });

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setTarget(undefined);
          mapInstanceRef.current = null;
          setOpenLayersLoadedState(false);
        }
      };
    }
  }, []);

  // Effect ສໍາລັບການຈັດການ Draw Interaction
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (activeDrawType !== "None") {
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: activeDrawType,
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.4)",
          }),
          stroke: new Stroke({
            color: "#00FFFF",
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "#00FFFF",
            }),
          }),
        }),
      });
      map.addInteraction(draw);
      drawInteractionRef.current = draw;
    }

    return () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
    };
  }, [activeDrawType]);

  // Effect ສໍາລັບການອັບເດດ View (Center/Zoom)
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      const currentCenter = toLonLat(view.getCenter()).map((coord) =>
        parseFloat(coord.toFixed(2))
      );
      const targetCenter = centerState.map((coord) =>
        parseFloat(coord.toFixed(2))
      );
      if (currentCenter.toString() !== targetCenter.toString()) {
        view.setCenter(fromLonLat(targetCenter));
      }
      if (view.getZoom().toFixed(2) !== zoomState.toFixed(2)) {
        view.setZoom(zoomState);
      }
    }
  }, [centerState, zoomState]);

  const handleDrawTypeChange = (type) => {
    setActiveDrawType(type);
  };

  const handleClearDrawings = () => {
    vectorSourceRef.current.clear();
    setActiveDrawType("None");
  };

  // --- Draggable Toolbar Logic ---
  const handleMouseDown = useCallback((e) => {
    if (draggableToolbarRef.current) {
      const rect = draggableToolbarRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const mapWrapperRect = mapRef.current.getBoundingClientRect();
      let newX = e.clientX - mapWrapperRect.left - dragOffset.current.x;
      let newY = e.clientY - mapWrapperRect.top - dragOffset.current.y;

      newX = Math.max(
        0,
        Math.min(
          newX,
          mapWrapperRect.width - draggableToolbarRef.current.offsetWidth
        )
      );
      newY = Math.max(
        0,
        Math.min(
          newY,
          mapWrapperRect.height - draggableToolbarRef.current.offsetHeight
        )
      );

      setToolbarPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="app-container">
      <header className="app-header">
        <button
          className="sidebar-toggle-button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? (
            <PanelRight size={24} />
          ) : (
            <PanelLeft size={24} />
          )}
        </button>
        <h1>ແອັບ Web Mapping ຂອງຂ້ອຍ</h1>
        <p>ສ້າງດ້ວຍ Vite, React, OpenLayers</p>
      </header>

      <main className="app-main responsive-main">
        <div className="map-wrapper" style={{ flex: 1, minHeight: 0 }}>
          <div
            ref={mapRef}
            className="map-container"
            style={{ width: "100%", height: "100%" }}
          ></div>
          {/* BaseMapSwitcher (ຖ້າທ່ານຕ້ອງການລວມມັນເຂົ້າ, ທ່ານຕ້ອງສ້າງໄຟລ໌ BaseMapSwitcher.jsx) */}
          {/* {mapInstanceRef.current && <BaseMapSwitcher map={mapInstanceRef.current} />} */}
          <div className="map-info">
            <p>
              ສູນກາງ: Lon {centerState[0]}, Lat {centerState[1]}
            </p>
            <p>ຊູມ: {zoomState}</p>
          </div>

          {/* Drawing Toolbar ທີ່ສາມາດລາກໄດ້, ຕຳແໜ່ງລອຍຢູ່ເທິງ map-wrapper */}
          <div
            ref={draggableToolbarRef}
            className="drawing-tools-floating"
            style={{
              left: toolbarPosition.x,
              top: toolbarPosition.y,
              transform:
                typeof toolbarPosition.y === "string"
                  ? `translateY(-50%)`
                  : "none",
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          >
            <DrawingToolbar
              onDrawTypeChange={handleDrawTypeChange}
              onClearDrawings={handleClearDrawings}
            />
          </div>
        </div>

        <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <h2>ການຄວບຄຸມແຜນທີ່</h2>
          <ProvinceControls
            setCenter={setCenterState}
            setZoom={setZoomState}
            openLayersLoaded={openLayersLoadedState}
            isSidebarCollapsed={isSidebarCollapsed} // ສົ່ງ isSidebarCollapsed ໄປ ProvinceControls
          />
          <div className="footer">&copy; 2025 Web Mapping App</div>
        </div>
      </main>
    </div>
  );
}

export default App;
