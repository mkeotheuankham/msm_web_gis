// src/MapComponent.jsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw, { createBox } from "ol/interaction/Draw";
import Snap from "ol/interaction/Snap";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";
import { defaults as defaultControls } from "ol/control";
import { defaults as defaultInteractions } from "ol/interaction";
import GeoJSON from "ol/format/GeoJSON";

import DrawingToolbar from "./components/ui/DrawingToolbar";
import BaseMapSwitcher from "./components/map/BaseMapSwitcher";
import CoordinateBar from "./components/ui/CoordinateBar";
import ParcelLayerControl from "./components/map/ParcelLayerControl";
import ParcelInfoPanel from "./components/ui/ParcelInfoPanel";
import RoadLayer from "./components/map/RoadLayer";
import BuildingLayer from "./components/map/BuildingLayer";

function MapComponent({
  onMapLoaded,
  children,
  districts,
  setDistricts,
  layerStates,
  updateLayerState,
  onParcelSelect,
  selectedParcel,
  loadTrigger,
  selectedBaseMap,
  setSelectedBaseMap,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const drawingSourceRef = useRef(new VectorSource());
  const measureSourceRef = useRef(new VectorSource());
  const drawInteractionRef = useRef(null);
  const modifyInteractionRef = useRef(null);
  const selectInteractionRef = useRef(null);
  const snapInteractionRef = useRef(null);

  const [interactionMode, setInteractionMode] = useState("None");
  const [isSnapActive, setIsSnapActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const historyIndexRef = useRef(historyIndex);
  historyIndexRef.current = historyIndex;

  const pushToHistory = useCallback(() => {
    const writer = new GeoJSON();
    const features = drawingSourceRef.current.getFeatures();
    const geoJsonStr = writer.writeFeatures(features);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndexRef.current + 1);
      newHistory.push(geoJsonStr);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, []);

  useEffect(() => {
    const currentMapContainer = mapRef.current;
    if (!currentMapContainer || mapInstanceRef.current) return;

    const osmLayer = new TileLayer({
      source: new OSM(),
      properties: { name: "OSM" },
    });
    const googleSatLayer = new TileLayer({
      source: new XYZ({
        url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
        maxZoom: 20,
      }),
      properties: { name: "Google Satellite" },
      visible: false,
    });
    const googleHybridLayer = new TileLayer({
      source: new XYZ({
        url: "http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
        maxZoom: 20,
      }),
      properties: { name: "Google Hybrid" },
      visible: false,
    });

    const drawingLayer = new VectorLayer({
      source: drawingSourceRef.current,
      style: new Style({
        fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
        stroke: new Stroke({ color: "#ffcc33", width: 3 }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ffcc33" }),
        }),
      }),
      properties: { name: "drawing_layer" },
      zIndex: 100,
    });

    const measureLayer = new VectorLayer({
      source: measureSourceRef.current,
      style: new Style({
        fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
        stroke: new Stroke({ color: "#ffcc33", width: 2 }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({ color: "#ffcc33" }),
        }),
      }),
      zIndex: 100,
    });

    const initialView = new View({
      center: fromLonLat([103.85, 18.2]),
      zoom: 7,
      minZoom: 2,
      maxZoom: 22,
    });

    const map = new Map({
      target: currentMapContainer,
      layers: [
        osmLayer,
        googleSatLayer,
        googleHybridLayer,
        drawingLayer,
        measureLayer,
      ],
      view: initialView,
      controls: defaultControls({ attribution: false, zoom: false }),
      interactions: defaultInteractions(),
    });

    mapInstanceRef.current = map;
    onMapLoaded.setViewInstance(initialView);
    onMapLoaded.setOpenLayersLoaded(true);
    pushToHistory();

    const resizeObserver = new ResizeObserver(() => map.updateSize());
    resizeObserver.observe(currentMapContainer);

    // Force map to update its size after the initial render to prevent black screen
    const timerId = setTimeout(() => map.updateSize(), 100);

    return () => {
      clearTimeout(timerId);
      map.setTarget(undefined);
      resizeObserver.disconnect();
    };
  }, [onMapLoaded, pushToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const features = new GeoJSON().readFeatures(history[newIndex]);
      drawingSourceRef.current.clear();
      drawingSourceRef.current.addFeatures(features);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const features = new GeoJSON().readFeatures(history[newIndex]);
      drawingSourceRef.current.clear();
      drawingSourceRef.current.addFeatures(features);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  const handleSave = () => {
    const writer = new GeoJSON();
    const features = drawingSourceRef.current.getFeatures();
    if (features.length === 0) {
      alert("ບໍ່ມີຂໍ້ມູນໃຫ້ບັນທຶກ!");
      return;
    }
    const geoJsonData = writer.writeFeaturesObject(features, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });
    console.log("Saving Data (GeoJSON):", JSON.stringify(geoJsonData, null, 2));
    alert(
      `ຂໍ້ມູນ GeoJSON ຈຳນວນ ${features.length} features ຖືກບັນທຶກລົງໃນ Console ແລ້ວ.`
    );
  };

  const clearDrawingAndMeasure = useCallback(() => {
    drawingSourceRef.current.clear();
    measureSourceRef.current.clear();
    pushToHistory();
  }, [pushToHistory]);

  const toggleSnap = useCallback(() => setIsSnapActive((prev) => !prev), []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drawInteractionRef.current)
      map.removeInteraction(drawInteractionRef.current);
    if (selectInteractionRef.current)
      map.removeInteraction(selectInteractionRef.current);
    if (modifyInteractionRef.current)
      map.removeInteraction(modifyInteractionRef.current);
    drawInteractionRef.current = null;
    selectInteractionRef.current = null;
    modifyInteractionRef.current = null;

    if (
      interactionMode.startsWith("Draw") ||
      interactionMode.startsWith("Measure")
    ) {
      const isMeasure = interactionMode.startsWith("Measure");
      const source = isMeasure
        ? measureSourceRef.current
        : drawingSourceRef.current;
      let type;
      if (interactionMode.endsWith("Area")) type = "Polygon";
      else if (interactionMode.endsWith("Length")) type = "LineString";
      else type = interactionMode.replace("Draw", "");

      const newDraw = new Draw({
        source,
        type: type === "Box" ? "Circle" : type,
        geometryFunction: type === "Box" ? createBox() : undefined,
      });
      map.addInteraction(newDraw);
      drawInteractionRef.current = newDraw;
      if (!isMeasure) {
        newDraw.on("drawend", () => setTimeout(pushToHistory, 0));
      }
    } else if (interactionMode === "Edit") {
      const select = new Select({
        layers: (l) => l.getSource() === drawingSourceRef.current,
      });
      const modify = new Modify({ features: select.getFeatures() });
      modify.on("modifyend", () => setTimeout(pushToHistory, 0));
      map.addInteraction(select);
      map.addInteraction(modify);
      selectInteractionRef.current = select;
      modifyInteractionRef.current = modify;
    }
  }, [interactionMode, pushToHistory]);

  // FINAL CORRECTED LOGIC FOR SNAP INTERACTION
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Always remove the old snap interaction first
    if (snapInteractionRef.current) {
      map.removeInteraction(snapInteractionRef.current);
    }

    // 2. If snap is toggled off, do nothing further
    if (!isSnapActive) {
      snapInteractionRef.current = null;
      return;
    }

    // 3. If snap is on, collect all sources and create a NEW interaction
    const layers = map.getLayers().getArray();
    const parcelLayers = layers.filter((l) =>
      l.get("name")?.startsWith("parcel_layer_")
    );

    const sourcesToSnap = [
      drawingSourceRef.current,
      ...parcelLayers.map((l) => l.getSource()),
    ];

    const newSnap = new Snap({
      sources: sourcesToSnap,
      pixelTolerance: 20,
    });

    map.addInteraction(newSnap);
    snapInteractionRef.current = newSnap; // Store the new instance
  }, [districts, isSnapActive]); // Rerun when snap is toggled or when layers might have changed

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container" />

      {children}

      {mapInstanceRef.current && (
        <>
          <BaseMapSwitcher
            map={mapInstanceRef.current}
            selectedBaseMap={selectedBaseMap}
            onSelectBaseMap={setSelectedBaseMap}
          />
          <DrawingToolbar
            onSetInteractionMode={setInteractionMode}
            currentInteractionMode={interactionMode}
            onClearDrawing={clearDrawingAndMeasure}
            isSnapActive={isSnapActive}
            onToggleSnap={toggleSnap}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSave={handleSave}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
          <ParcelLayerControl
            map={mapInstanceRef.current}
            districts={districts}
            setDistricts={setDistricts}
            onParcelSelect={onParcelSelect}
            loadTrigger={loadTrigger}
          />
          <RoadLayer
            map={mapInstanceRef.current}
            isVisible={layerStates.road.isVisible}
            onLoadingChange={(isLoading) =>
              updateLayerState("road", { isLoading })
            }
            onErrorChange={(error) => updateLayerState("road", { error })}
          />
          <BuildingLayer
            map={mapInstanceRef.current}
            isVisible={layerStates.building.isVisible}
            onLoadingChange={(isLoading) =>
              updateLayerState("building", { isLoading })
            }
            onErrorChange={(error) => updateLayerState("building", { error })}
          />
          {selectedParcel && (
            <ParcelInfoPanel
              parcel={selectedParcel}
              onClose={() => onParcelSelect(null)}
            />
          )}
          <CoordinateBar map={mapInstanceRef.current} />
        </>
      )}
    </div>
  );
}

export default MapComponent;
