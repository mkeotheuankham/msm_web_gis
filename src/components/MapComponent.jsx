import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";
import { defaults as defaultControls } from "ol/control";
import "ol/ol.css";

import ProvinceControls from "./ui/ProvinceControls";
import DrawingToolbar from "./ui/DrawingToolbar";
import BaseMapSwitcher from "./map/BaseMapSwitcher";
import CoordinateBar from "./ui/CoordinateBar"; // ນໍາເຂົ້າ CoordinateBar
import { PanelLeft, PanelRight } from "lucide-react";

function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const drawInteractionRef = useRef(null);
  const draggableToolbarRef = useRef(null); // Ref for the draggable toolbar

  const [centerState, setCenterState] = useState([102.6, 17.96]);
  const [zoomState, setZoomState] = useState(7);
  // This state indicates if the OpenLayers map instance is fully loaded and ready
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const [drawType, setDrawType] = useState("None");
  // Initial toolbar position. Use numeric values for precise placement
  const [toolbarPosition, setToolbarPosition] = useState({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false); // State to check if currently dragging

  const [drawnFeatures, setDrawnFeatures] = useState([]);

  const baseMapLayers = [
    {
      name: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      source: "OSM",
    },
    {
      name: "Stadia Satellite",
      url: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg",
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
      source: "XYZ",
    },
    {
      name: "OSM Breton",
      url: "https://tile.openstreetmap.bzh/ca/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://www.openstreetmap.cat" target="_blank">Breton OpenStreetMap Team</a>',
      source: "XYZ",
    },
    {
      name: "Esri World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
      source: "XYZ",
    },
  ];

  const [activeBaseMap, setActiveBaseMap] = useState(baseMapLayers[0].name);

  console.log("MapComponent render - centerState:", centerState);
  console.log("MapComponent render - zoomState:", zoomState);

  const vectorLayerRef = useRef(
    new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
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
      }),
    })
  );

  const interactionDrawingStyle = new Style({
    fill: new Fill({
      color: "rgba(0, 255, 255, 0.2)",
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
  });

  const handleClearDrawings = useCallback(() => {
    vectorSourceRef.current.clear();
    setDrawnFeatures([]);
    setDrawType("None");
  }, []);

  // Effect for map initialization (runs once on mount)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialView = new View({
      center: fromLonLat(centerState),
      zoom: zoomState,
      minZoom: 2,
      maxZoom: 18,
    });

    const map = new Map({
      target: mapRef.current,
      view: initialView,
      controls: defaultControls().extend([]),
    });

    // Add vector layer (always present for drawings)
    map.addLayer(vectorLayerRef.current);

    // --- Add the INITIAL base map layer here during map setup ---
    const initialBaseMapDef = baseMapLayers.find(
      (layer) => layer.name === activeBaseMap
    );

    if (initialBaseMapDef) {
      let initialBaseLayer;
      if (initialBaseMapDef.source === "OSM") {
        initialBaseLayer = new TileLayer({
          source: new OSM({
            attributions: initialBaseMapDef.attribution,
          }),
          properties: { isBaseLayer: true }, // Mark as base layer
        });
      } else if (initialBaseMapDef.source === "XYZ") {
        initialBaseLayer = new TileLayer({
          source: new XYZ({
            url: initialBaseMapDef.url,
            attributions: initialBaseMapDef.attribution,
          }),
          properties: { isBaseLayer: true }, // Mark as base layer
        });
      }
      if (initialBaseLayer) {
        // Add the initial base layer at the bottom (index 0) of the layer stack
        map.getLayers().insertAt(0, initialBaseLayer);
      }
    }
    // --- END INITIAL base map setup ---

    mapInstanceRef.current = map; // Store map instance in ref

    const handleMoveEnd = () => {
      const newCenter = toLonLat(map.getView().getCenter());
      const newZoom = map.getView().getZoom();
      console.log("Map 'moveend' event - newCenter:", newCenter);
      console.log("Map 'moveend' event - newZoom:", newZoom);
      setCenterState([
        parseFloat(newCenter[0].toFixed(2)),
        parseFloat(newCenter[1].toFixed(2)),
      ]);
      setZoomState(parseFloat(newZoom.toFixed(2)));
    };

    map.on("moveend", handleMoveEnd);

    // Set OpenLayers loaded state AFTER map instance is ready
    setOpenLayersLoadedState(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.un("moveend", handleMoveEnd);
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array: runs only once on mount

  // Effect to manage base map layers when activeBaseMap changes
  // This effect will now only run *after* the initial map setup is complete
  useEffect(() => {
    // Only proceed if the map is initialized and OpenLayers is loaded
    if (!mapInstanceRef.current || !openLayersLoadedState) return;

    // Remove all existing base layers marked as 'isBaseLayer'
    const layersToRemove = [];
    mapInstanceRef.current.getLayers().forEach((layer) => {
      if (layer.get("isBaseLayer")) {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach((layer) =>
      mapInstanceRef.current.removeLayer(layer)
    );

    // Find the currently active base map definition
    const currentBaseMapDef = baseMapLayers.find(
      (layer) => layer.name === activeBaseMap
    );

    if (currentBaseMapDef) {
      let newBaseLayer;
      if (currentBaseMapDef.source === "OSM") {
        newBaseLayer = new TileLayer({
          source: new OSM({
            attributions: currentBaseMapDef.attribution,
          }),
          properties: { isBaseLayer: true },
        });
      } else if (currentBaseMapDef.source === "XYZ") {
        newBaseLayer = new TileLayer({
          source: new XYZ({
            url: currentBaseMapDef.url,
            attributions: currentBaseMapDef.attribution,
          }),
          properties: { isBaseLayer: true },
        });
      }
      if (newBaseLayer) {
        // Add the new base layer at the bottom (index 0) of the layer stack
        mapInstanceRef.current.getLayers().insertAt(0, newBaseLayer);
      }
    }
  }, [activeBaseMap, openLayersLoadedState]); // Depends on both to ensure correct timing

  // useEffect to update View when centerState or zoomState changes (e.g., from ProvinceControls)
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      console.log(
        "useEffect [centerState, zoomState] triggered. Updating view."
      );
      if (centerState && centerState.length === 2) {
        view.setCenter(fromLonLat(centerState));
      } else {
        console.warn(
          "centerState is undefined or invalid, cannot set map center."
        );
      }
      view.setZoom(zoomState);
    }
  }, [centerState, zoomState]);

  // useEffect for handling draw interaction
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (drawInteractionRef.current) {
      mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
    }

    if (drawType !== "None") {
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: drawType,
        style: interactionDrawingStyle,
      });
      mapInstanceRef.current.addInteraction(draw);
      drawInteractionRef.current = draw;

      draw.on("drawend", (event) => {
        setDrawnFeatures((prevFeatures) => [...prevFeatures, event.feature]);
      });
    }

    return () => {
      if (drawInteractionRef.current) {
        mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
    };
  }, [drawType]);

  // Functions for draggable toolbar
  // handleMouseDown, handleMouseMove, handleMouseUp are the parts that handle dragging
  const handleMouseDown = useCallback(
    (e) => {
      // Prevent text selection while dragging
      e.preventDefault();
      setIsDragging(true);

      const offsetX =
        e.clientX - draggableToolbarRef.current.getBoundingClientRect().left;
      const offsetY =
        e.clientY - draggableToolbarRef.current.getBoundingClientRect().top;

      const handleMouseMove = (event) => {
        if (isDragging) {
          // Use event's clientX/Y to calculate the new position of the toolbar
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
        <div className="header-title-block">
          <h1>MSM Web GIS</h1>
          <p>ລະບົບຂໍ້ມູນພູມສາດສຳລັບການຕິດຕາມ ແລະ ປະເມີນຜົນ</p>
        </div>

        <button
          onClick={toggleSidebar}
          className="toggle-button sidebar-toggle-button"
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

          {/* Base Map Switcher component - Positioned on the map */}
          <BaseMapSwitcher
            activeBaseMap={activeBaseMap}
            setActiveBaseMap={setActiveBaseMap}
            baseMapLayers={baseMapLayers}
            openLayersLoaded={openLayersLoadedState}
          />

          {/* Draggable Drawing Toolbar, floating on top of map-wrapper */}
          <div
            ref={draggableToolbarRef}
            className={`drawing-tools-floating ${
              isDragging ? "dragging" : ""
            }`} /* Add 'dragging' class */
            style={{
              left: toolbarPosition.x,
              top: toolbarPosition.y,
              // Vertical positioning, only used if y is a string (e.g., "50%")
              transform:
                typeof toolbarPosition.y === "string"
                  ? `translateY(-50%)`
                  : "none",
              cursor: isDragging ? "grabbing" : "grab", // Change cursor to indicate draggable
            }}
            onMouseDown={handleMouseDown} // Start dragging on mouse down
          >
            <DrawingToolbar
              onDrawTypeChange={handleDrawTypeChange}
              onClearDrawings={handleClearDrawings}
            />
          </div>
          {/* CoordinateBar component - ໃຫ້ map instance ແກ່ມັນ */}
          {mapInstanceRef.current && (
            <CoordinateBar map={mapInstanceRef.current} />
          )}
        </div>

        <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <h2>Map Controls</h2>
          <ProvinceControls
            setCenter={setCenterState}
            setZoom={setZoomState}
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
