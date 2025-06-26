import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj"; // ແກ້ໄຂ: ລຶບ '=' ທີ່ເກີນອອກ
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";

// Components ຂອງທ່ານ (ດຽວນີ້ຖືກນຳເຂົ້າຈາກໂຟນເດີ components)
import ProvinceControls from "./components/ProvinceControls";
// ໃຫ້ແນ່ໃຈວ່າທ່ານໄດ້ສ້າງໄຟລ໌ BaseMapSwitcher.jsx ຢູ່ໃນ src/components/
// ຖ້າທ່ານຕ້ອງການ BaseMapSwitcher ກັບມາ, ທ່ານຕ້ອງສ້າງໄຟລ໌ນັ້ນດ້ວຍເນື້ອໃນທີ່ຖືກຕ້ອງ.
// import BaseMapSwitcher from "./components/BaseMapSwitcher";
import DrawingToolbar from "./components/DrawingToolbar";

// !!! ສໍາຄັນ: ຟັງຊັນ ProvinceControls ໄດ້ຖືກລຶບອອກຈາກບ່ອນນີ້ແລ້ວ.
// ມັນຄວນຈະຢູ່ໃນ src/components/ProvinceControls.jsx ເທົ່ານັ້ນ.

function App() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const drawInteractionRef = useRef(null);
  const draggableToolbarRef = useRef(null); // Ref for the draggable drawing toolbar

  const [centerState, setCenterState] = useState([102.3, 17.97]);
  const [zoomState, setZoomState] = useState(10);
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);
  const [activeDrawType, setActiveDrawType] = useState("None");

  // State for draggable toolbar position
  const [toolbarPosition, setToolbarPosition] = useState({ x: 50, y: "50%" }); // Start at 50px from left, 50% from top
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 }); // To store the offset from mouse to element top-left

  // Effect ສໍາລັບການເລີ່ມຕົ້ນ Map ແລະເພີ່ມ Layer ການແຕ້ມ
  useEffect(() => {
    if (mapRef.current) {
      // ກໍານົດ Style ເລີ່ມຕົ້ນສໍາລັບ Features ທີ່ແຕ້ມ
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
        style: drawStyle, // ນໍາໃຊ້ Style ທີ່ກໍານົດໄວ້
        properties: { name: "drawingLayer" }, // ກໍານົດຊື່ໃຫ້ Layer ເພື່ອໃຫ້ສາມາດອ້າງອີງໄດ້ງ່າຍ
      });

      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            // ນີ້ແມ່ນ TileLayer ພື້ນຖານ (OSM) ທີ່ທ່ານມີໃນ App.jsx ເດີມ
            source: new OSM(),
          }),
          vectorLayer, // ເພີ່ມ VectorLayer ສໍາລັບການແຕ້ມເທິງ Base Map
        ],
        view: new View({
          center: fromLonLat(centerState), // ຍັງໃຊ້ fromLonLat
          zoom: zoomState,
        }),
      });

      mapInstanceRef.current = map;
      setOpenLayersLoadedState(true); // ສະແດງວ່າ OpenLayers Map ຖືກໂຫຼດແລ້ວ

      // Event listener ສໍາລັບການເຄື່ອນຍ້າຍ Map
      map.on("moveend", () => {
        const view = map.getView();
        const newCenter = toLonLat(view.getCenter()); // ຍັງໃຊ້ toLonLat
        const newZoom = view.getZoom();
        setCenterState([
          parseFloat(newCenter[0].toFixed(2)),
          parseFloat(newCenter[1].toFixed(2)),
        ]);
        setZoomState(parseFloat(newZoom.toFixed(2)));
      });

      // Cleanup function ສໍາລັບ Map instance
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setTarget(undefined);
          mapInstanceRef.current = null;
          setOpenLayersLoadedState(false);
        }
      };
    }
  }, []); // Empty dependency array ຫມາຍຄວາມວ່າ effect ນີ້ຈະແລ່ນພຽງຄັ້ງດຽວເມື່ອ Component Mount

  // Effect ສໍາລັບການຈັດການ Draw Interaction
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove any existing draw interaction before adding a new one
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null; // Clear the ref
    }

    // Add new draw interaction if a valid draw type is selected
    if (activeDrawType !== "None") {
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: activeDrawType, // 'Point', 'LineString', 'Polygon', 'Circle'
        style: new Style({
          // Style for the feature being drawn (while drawing)
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.4)",
          }),
          stroke: new Stroke({
            color: "#00FFFF", // Cyan color for active drawing
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

    // Cleanup function: remove interaction when component unmounts or activeDrawType changes
    return () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
    };
  }, [activeDrawType]); // Dependency: Re-run this effect when 'activeDrawType' changes

  // Effect ສໍາລັບການອັບເດດ Map View (Center/Zoom) ໂດຍອີງໃສ່ການປ່ຽນແປງ State
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      const currentCenter = toLonLat(view.getCenter()).map((coord) =>
        parseFloat(coord.toFixed(2))
      );
      const targetCenter = centerState.map((coord) =>
        parseFloat(coord.toFixed(2))
      );
      // Update center if it has changed
      if (currentCenter.toString() !== targetCenter.toString()) {
        view.setCenter(fromLonLat(targetCenter)); // Use targetCenter here
      }
      if (view.getZoom().toFixed(2) !== zoomState.toFixed(2)) {
        view.setZoom(zoomState);
      }
    }
  }, [centerState, zoomState]); // Dependencies: Re-run this effect when 'centerState' or 'zoomState' changes

  // Handler for changing the drawing tool type
  const handleDrawTypeChange = (type) => {
    setActiveDrawType(type);
  };

  // Handler for clearing all drawn features
  const handleClearDrawings = () => {
    vectorSourceRef.current.clear(); // Clear all features from the vector source
    setActiveDrawType("None"); // Set drawing mode to 'None' after clearing
  };

  // --- Draggable Toolbar Logic ---
  const handleMouseDown = useCallback((e) => {
    if (draggableToolbarRef.current) {
      const rect = draggableToolbarRef.current.getBoundingClientRect();
      // Calculate offset from mouse click to the element's top-left corner
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      // Prevent text selection during drag
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      // Calculate new position relative to the map-wrapper
      const mapWrapperRect = mapRef.current.getBoundingClientRect();
      let newX = e.clientX - mapWrapperRect.left - dragOffset.current.x;
      let newY = e.clientY - mapWrapperRect.top - dragOffset.current.y;

      // Constrain movement within map-wrapper boundaries
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

  // Add and remove global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    // Cleanup: remove listeners when component unmounts or isDragging changes
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MSM Web GIS</h1>
        <p>ພັດທະນາໂດຍ ມິດສະໄໝ ແກ້ວເທື່ອນຄຳ</p>
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
              // Use transform for smoother animation and better performance
              transform:
                typeof toolbarPosition.y === "string"
                  ? `translateY(-50%)`
                  : "none", // For initial '50%' top
              cursor: isDragging ? "grabbing" : "grab", // Change cursor when dragging
            }}
            onMouseDown={handleMouseDown}
          >
            <DrawingToolbar
              onDrawTypeChange={handleDrawTypeChange}
              onClearDrawings={handleClearDrawings}
            />
          </div>
        </div>

        <div className="sidebar" style={{ width: "300px", maxWidth: "100%" }}>
          <h2>ການຄວບຄຸມແຜນທີ່</h2>
          <ProvinceControls
            setCenter={setCenterState}
            setZoom={setZoomState}
            openLayersLoaded={openLayersLoadedState}
          />
          <div className="footer">&copy; 2025 Web Mapping App</div>
        </div>
      </main>
    </div>
  );
}

export default App;
