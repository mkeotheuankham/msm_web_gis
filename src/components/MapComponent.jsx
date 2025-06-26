import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";
import { defaults as defaultControls } from "ol/control";
import "ol/ol.css"; // Import OpenLayers CSS

// Your components (now imported from the same folder)
import ProvinceControls from "./ProvinceControls"; // Corrected import path
import DrawingToolbar from "./DrawingToolbar"; // Corrected import path
import { PanelLeft, PanelRight } from "lucide-react"; // Import icons for Toggle Sidebar button

function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const drawInteractionRef = useRef(null);
  const draggableToolbarRef = useRef(null);

  // Define initial center and zoom
  // This is the internal state for MapComponent to display current values
  const [centerState, setCenterState] = useState([102.6, 17.96]);
  const [zoomState, setZoomState] = useState(8);
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);

  // Set initial value to true to collapse Sidebar on first load
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const [drawType, setDrawType] = useState("None");
  // Initial toolbar position. Use numeric values for precise placement
  const [toolbarPosition, setToolbarPosition] = useState({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState([]);

  // --- LOGGING FOR DEBUGGING ---
  console.log("MapComponent render - centerState:", centerState);
  console.log("MapComponent render - zoomState:", zoomState);
  // --- END LOGGING ---

  // Ref for VectorLayer to persist it between re-renders
  const vectorLayerRef = useRef(
    new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ffcc33", // Color for completed drawings
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "#ffcc33",
          }),
        }),
      }),
    })
  );

  // Style for the drawing being created (Interaction Style)
  const interactionDrawingStyle = new Style({
    fill: new Fill({
      color: "rgba(0, 255, 255, 0.2)", // Transparent blue
    }),
    stroke: new Stroke({
      color: "#00FFFF", // Blue
      width: 2,
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: "#00FFFF",
      }),
    }),
  });

  // Callback for clearing drawings
  const handleClearDrawings = useCallback(() => {
    vectorSourceRef.current.clear(); // Clear all features from VectorSource
    setDrawnFeatures([]); // Clear state of drawn features
    setDrawType("None"); // Stop drawing mode after clearing
  }, []);

  // Effect for map initialization and adding drawing layer
  useEffect(() => {
    // If mapRef is not connected or mapInstance is already created, do nothing
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialView = new View({
      center: fromLonLat(centerState), // Use defined centerState
      zoom: zoomState, // Use defined zoomState
      minZoom: 2, // Min zoom level
      maxZoom: 18, // Max zoom level
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayerRef.current, // Add VectorLayer for drawing
      ],
      view: initialView,
      controls: defaultControls().extend([]), // Remove unwanted controls
    });

    mapInstanceRef.current = map; // Store map instance in ref

    // Listen for map view changes and update state
    const handleMoveEnd = () => {
      const newCenter = toLonLat(map.getView().getCenter());
      const newZoom = map.getView().getZoom();
      // --- LOGGING FOR DEBUGGING ---
      console.log("Map 'moveend' event - newCenter:", newCenter);
      console.log("Map 'moveend' event - newZoom:", newZoom);
      // --- END LOGGING ---
      // Update centerState and zoomState within MapComponent
      setCenterState([
        parseFloat(newCenter[0].toFixed(2)),
        parseFloat(newCenter[1].toFixed(2)),
      ]);
      setZoomState(parseFloat(newZoom.toFixed(2)));
    };

    map.on("moveend", handleMoveEnd);

    setOpenLayersLoadedState(true); // Indicate OpenLayers is loaded

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.un("moveend", handleMoveEnd); // Remove event listener
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []); // This runs only once after component mounts

  // useEffect to update View when centerState or zoomState changes (e.g., from ProvinceControls)
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      // --- LOGGING FOR DEBUGGING ---
      console.log(
        "useEffect [centerState, zoomState] triggered. Updating view."
      );
      // --- END LOGGING ---
      // Check centerState before use
      if (centerState && centerState.length === 2) {
        view.setCenter(fromLonLat(centerState));
      } else {
        console.warn(
          "centerState is undefined or invalid, cannot set map center."
        );
      }
      view.setZoom(zoomState);
    }
  }, [centerState, zoomState]); // Listen for changes to centerState and zoomState

  // useEffect for handling draw interaction
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old interaction if it exists
    if (drawInteractionRef.current) {
      mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
    }

    if (drawType !== "None") {
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: drawType,
        style: interactionDrawingStyle, // Use style for drawing interaction
      });
      mapInstanceRef.current.addInteraction(draw);
      drawInteractionRef.current = draw;

      draw.on("drawend", (event) => {
        // Add drawn feature to state
        setDrawnFeatures((prevFeatures) => [...prevFeatures, event.feature]);
      });
    }

    // Cleanup function to remove interaction when component unmounts or drawType changes
    return () => {
      if (drawInteractionRef.current) {
        mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null; // Clear ref after removing interaction
      }
    };
  }, [drawType]); // Re-run when drawType changes

  // Functions for draggable toolbar
  const handleMouseDown = useCallback(
    (e) => {
      // Prevent text selection during drag
      e.preventDefault();
      setIsDragging(true);

      const offsetX =
        e.clientX - draggableToolbarRef.current.getBoundingClientRect().left;
      const offsetY =
        e.clientY - draggableToolbarRef.current.getBoundingClientRect().top;

      const handleMouseMove = (event) => {
        if (isDragging) {
          // Use event's clientX/Y to calculate position
          setToolbarPosition({
            x: event.clientX - offsetX,
            y: event.clientY - offsetY,
          });
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [isDragging]
  ); // isDragging is a dependency because it's used inside handleMouseMove

  const handleDrawTypeChange = useCallback((type) => {
    setDrawType(type);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MSM Web GIS</h1>
        <p>ລະບົບຂໍ້ມູນພູມສາດສຳລັບການຕິດຕາມ ແລະ ປະເມີນຜົນ</p>
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-button"
          aria-label={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelRight size={24} />
          ) : (
            <PanelLeft size={24} />
          )}
        </button>
      </header>

      <main className="app-main responsive-main">
        <div className="map-wrapper">
          <div
            ref={mapRef}
            className="map-container"
            style={{ width: "100%", height: "100%" }}
          ></div>
          {/* Map info display removed as per user request */}
          {/* <div className="map-info">
            {centerState && centerState.length === 2 ? (
              <>
                <p>
                  Center: Lon {centerState[0].toFixed(2)}, Lat {centerState[1].toFixed(2)}
                </p>
                <p>Zoom: {zoomState.toFixed(2)}</p>
              </>
            ) : (
              <p>Loading map data...</p>
            )}
          </div> */}

          {/* Draggable Drawing Toolbar, floating on top of map-wrapper */}
          <div
            ref={draggableToolbarRef}
            className="drawing-tools-floating"
            style={{
              left: toolbarPosition.x,
              top: toolbarPosition.y,
              // Vertical positioning, only used if y is a string (e.g., "50%")
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
          <h2>Map Controls</h2>
          <ProvinceControls
            setCenter={setCenterState} // Pass setCenterState to ProvinceControls
            setZoom={setZoomState} // Pass setZoomState to ProvinceControls
            openLayersLoaded={openLayersLoadedState}
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <div className="footer">&copy; 2025 Web Mapping Application</div>
        </div>
      </main>
    </div>
  );
}

export default MapComponent;
