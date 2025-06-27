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
import { defaults as defaultInteractions } from "ol/interaction";
import "ol/ol.css";

import ProvinceControls from "./components/ui/ProvinceControls";
import DrawingToolbar from "./components/ui/DrawingToolbar";
import BaseMapSwitcher from "./components/map/BaseMapSwitcher";
import CoordinateBar from "./components/ui/CoordinateBar";
import { PanelLeft, PanelRight } from "lucide-react";

function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const drawInteractionRef = useRef(null);
  const draggableToolbarRef = useRef(null);

  const [centerState, setCenterState] = useState([102.6, 17.96]);
  const [zoomState, setZoomState] = useState(7);
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [drawType, setDrawType] = useState("None");
  const [toolbarPosition, setToolbarPosition] = useState({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
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

  const vectorLayerRef = useRef(
    new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
        fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
        stroke: new Stroke({ color: "#ffcc33", width: 2 }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ffcc33" }),
        }),
      }),
    })
  );

  const interactionDrawingStyle = new Style({
    fill: new Fill({ color: "rgba(0, 255, 255, 0.2)" }),
    stroke: new Stroke({ color: "#00FFFF", width: 2 }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: "#00FFFF" }),
    }),
  });

  const handleClearDrawings = useCallback(() => {
    vectorSourceRef.current.clear();
    setDrawnFeatures([]);
    setDrawType("None");
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialView = new View({
      center: fromLonLat(centerState),
      zoom: zoomState,
      minZoom: 2,
      maxZoom: 21,
      constrainResolution: true,
      multiWorld: false,
    });

    const map = new Map({
      target: mapRef.current,
      view: initialView,
      controls: defaultControls({ zoom: false }),
      interactions: defaultInteractions({
        doubleClickZoom: false, // ปิด double-click zoom เท่านั้น
      }),
    });

    map.addLayer(vectorLayerRef.current);

    const initialBaseMapDef = baseMapLayers.find(
      (layer) => layer.name === activeBaseMap
    );

    if (initialBaseMapDef) {
      const baseLayer =
        initialBaseMapDef.source === "OSM"
          ? new TileLayer({
              source: new OSM({ attributions: initialBaseMapDef.attribution }),
              properties: { isBaseLayer: true },
            })
          : new TileLayer({
              source: new XYZ({
                url: initialBaseMapDef.url,
                attributions: initialBaseMapDef.attribution,
              }),
              properties: { isBaseLayer: true },
            });

      map.getLayers().insertAt(0, baseLayer);
    }

    mapInstanceRef.current = map;

    const handleMoveEnd = () => {
      // const newCenter = toLonLat(map.getView().getCenter());
      // const newZoom = map.getView().getZoom();
      // setCenterState([
      //   parseFloat(newCenter[0].toFixed(2)),
      //   parseFloat(newCenter[1].toFixed(2)),
      // ]);
      // setZoomState(parseFloat(newZoom.toFixed(2)));
    };

    map.on("moveend", handleMoveEnd);
    setOpenLayersLoadedState(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.un("moveend", handleMoveEnd);
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !openLayersLoadedState) return;

    const layersToRemove = [];
    mapInstanceRef.current.getLayers().forEach((layer) => {
      if (layer.get("isBaseLayer")) layersToRemove.push(layer);
    });
    layersToRemove.forEach((layer) =>
      mapInstanceRef.current.removeLayer(layer)
    );

    const baseMap = baseMapLayers.find((layer) => layer.name === activeBaseMap);

    if (baseMap) {
      const newLayer =
        baseMap.source === "OSM"
          ? new TileLayer({
              source: new OSM({ attributions: baseMap.attribution }),
              properties: { isBaseLayer: true },
            })
          : new TileLayer({
              source: new XYZ({
                url: baseMap.url,
                attributions: baseMap.attribution,
              }),
              properties: { isBaseLayer: true },
            });

      mapInstanceRef.current.getLayers().insertAt(0, newLayer);
    }
  }, [activeBaseMap, openLayersLoadedState]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      view.setCenter(fromLonLat(centerState));
      view.setZoom(zoomState);
    }
  }, [centerState, zoomState]);

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
        setDrawnFeatures((prev) => [...prev, event.feature]);
      });
    }

    return () => {
      if (drawInteractionRef.current) {
        mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
    };
  }, [drawType]);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      const offsetX =
        e.clientX - draggableToolbarRef.current.getBoundingClientRect().left;
      const offsetY =
        e.clientY - draggableToolbarRef.current.getBoundingClientRect().top;

      const handleMouseMove = (event) => {
        if (isDragging) {
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
  );

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
      </header>

      <main className="app-main responsive-main">
        <div className="map-wrapper">
          <div
            ref={mapRef}
            className="map-container"
            style={{ width: "100%", height: "100%" }}
          ></div>

          <BaseMapSwitcher
            activeBaseMap={activeBaseMap}
            setActiveBaseMap={setActiveBaseMap}
            baseMapLayers={baseMapLayers}
            openLayersLoaded={openLayersLoadedState}
          />

          <div
            ref={draggableToolbarRef}
            className={`drawing-tools-floating ${isDragging ? "dragging" : ""}`}
            style={{
              left: toolbarPosition.x,
              top: toolbarPosition.y,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          >
            <DrawingToolbar
              onDrawTypeChange={handleDrawTypeChange}
              onClearDrawings={handleClearDrawings}
            />
          </div>

          {mapInstanceRef.current && (
            <CoordinateBar map={mapInstanceRef.current} />
          )}
        </div>

        <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
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
