import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
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
import "ol/ol.css";

import ProvinceControls from "./components/ui/ProvinceControls";
import DrawingToolbar from "./components/ui/DrawingToolbar";
import BaseMapSwitcher from "./components/map/BaseMapSwitcher";
import CoordinateBar from "./components/ui/CoordinateBar";
import ParcelLayerControl from "./components/map/ParcelLayerControl";
import ParcelInfoPanel from "./components/ui/ParcelInfoPanel";
import DistrictSelector from "./components/ui/DistrictSelector";
import RoadLayer from "./components/map/RoadLayer";
import BuildingLayer from "./components/map/BuildingLayer";
import LoadingBar from "./LoadingBar";

import { PanelLeft, PanelRight, AlertCircle } from "lucide-react";
import initialLaoDistricts from "./data/LaoDistrictsData";
import GeoJSON from "ol/format/GeoJSON";

const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};
const ErrorOverlay = ({ errorMessage, style }) => {
  if (!errorMessage) return null;
  return (
    <div className="map-overlay-status error" style={style}>
      <AlertCircle size={24} className="text-red-500 mr-2" />
      ຂໍ້ຜິດພາດ: {errorMessage}
    </div>
  );
};

function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const viewInstanceRef = useRef(null);

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

  const helpTooltipRef = useRef(null);
  const measureTooltipRef = useRef(null);

  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);
  const [centerState] = useState(fromLonLat([103.85, 18.2]));
  const [zoomState] = useState(7);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isDistrictsExpanded, setIsDistrictsExpanded] = useState(true);
  const [isProvincesExpanded, setIsProvincesExpanded] = useState(true);

  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState(null);
  const [loadTrigger, setLoadTrigger] = useState(0);

  const [layerStates, setLayerStates] = useState({
    road: { isVisible: false, isLoading: false, error: null },
    building: { isVisible: false, isLoading: false, error: null },
  });
  const [districts, setDistricts] = useState(initialLaoDistricts);

  const [selectedBaseMap, setSelectedBaseMap] = useState("OSM");
  const [parcelLoadingProgress, setParcelLoadingProgress] = useState(0);
  const [parcelLoadedFeaturesCount, setParcelLoadedFeaturesCount] = useState(0);

  const updateLayerState = useCallback((layerName, newState) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerName]: { ...prev[layerName], ...newState },
    }));
  }, []);

  const handleRoadLoadingChange = useCallback(
    (isLoading) => updateLayerState("road", { isLoading }),
    [updateLayerState]
  );
  const handleRoadErrorChange = useCallback(
    (error) => updateLayerState("road", { error }),
    [updateLayerState]
  );
  const handleBuildingLoadingChange = useCallback(
    (isLoading) => updateLayerState("building", { isLoading }),
    [updateLayerState]
  );
  const handleBuildingErrorChange = useCallback(
    (error) => updateLayerState("building", { error }),
    [updateLayerState]
  );

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleDistrict = useCallback(
    (districtName) =>
      setDistricts((prev) =>
        prev.map((d) =>
          d.name === districtName ? { ...d, checked: !d.checked } : d
        )
      ),
    []
  );
  const handleLoadData = useCallback(() => setLoadTrigger((c) => c + 1), []);
  const toggleSnap = useCallback(() => setIsSnapActive((prev) => !prev), []);

  const handleProvinceSelectionForMap = useCallback(
    (coords, zoom, provinceName) => {
      if (mapInstanceRef.current && viewInstanceRef.current) {
        viewInstanceRef.current.animate({
          center: coords,
          zoom: zoom,
          duration: 1000,
        });
      }
      setSelectedProvinceForDistricts(provinceName);
    },
    []
  );

  useEffect(() => {
    let map;
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
    });

    const initialView = new View({
      center: centerState,
      zoom: zoomState,
      minZoom: 2,
      maxZoom: 22,
    });

    map = new Map({
      target: currentMapContainer,
      layers: [
        osmLayer,
        googleSatLayer,
        googleHybridLayer,
        drawingLayer,
        measureLayer,
      ],
      view: initialView,
      controls: defaultControls(),
      interactions: defaultInteractions(),
    });

    mapInstanceRef.current = map;
    viewInstanceRef.current = initialView;

    setOpenLayersLoadedState(true);

    const resizeObserver = new ResizeObserver(() => map.updateSize());
    resizeObserver.observe(currentMapContainer);

    return () => {
      map.setTarget(undefined);
      resizeObserver.disconnect();
    };
  }, [centerState, zoomState]);

  const pushToHistory = useCallback(() => {
    const writer = new GeoJSON();
    const features = drawingSourceRef.current.getFeatures();
    const geoJsonStr = writer.writeFeatures(features);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(geoJsonStr);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  useEffect(() => {
    if (openLayersLoadedState && history.length === 0) {
      pushToHistory();
    }
  }, [openLayersLoadedState, history.length, pushToHistory]);

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
    if (helpTooltipRef.current)
      mapInstanceRef.current.removeOverlay(helpTooltipRef.current);
    if (measureTooltipRef.current)
      mapInstanceRef.current.removeOverlay(measureTooltipRef.current);
    pushToHistory();
  }, [pushToHistory]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const removeAllInteractions = () => {
      if (drawInteractionRef.current)
        map.removeInteraction(drawInteractionRef.current);
      if (selectInteractionRef.current)
        map.removeInteraction(selectInteractionRef.current);
      if (modifyInteractionRef.current)
        map.removeInteraction(modifyInteractionRef.current);
      if (helpTooltipRef.current) map.removeOverlay(helpTooltipRef.current);
      if (measureTooltipRef.current)
        map.removeOverlay(measureTooltipRef.current);
    };
    removeAllInteractions();

    let drawType;
    if (interactionMode.startsWith("Draw"))
      drawType = interactionMode.replace("Draw", "");
    else if (interactionMode.startsWith("Measure"))
      drawType = interactionMode === "MeasureArea" ? "Polygon" : "LineString";

    if (drawType) {
      const source = interactionMode.startsWith("Measure")
        ? measureSourceRef.current
        : drawingSourceRef.current;
      const newDraw = new Draw({
        source,
        type: drawType === "Box" ? "Circle" : drawType,
        geometryFunction: drawType === "Box" ? createBox() : undefined,
      });
      map.addInteraction(newDraw);
      drawInteractionRef.current = newDraw;
      if (!interactionMode.startsWith("Measure"))
        newDraw.on("drawend", () => setTimeout(pushToHistory, 0));
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

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (snapInteractionRef.current)
      map.removeInteraction(snapInteractionRef.current);
    if (isSnapActive) {
      const newSnap = new Snap({ pixelTolerance: 20 });
      map.addInteraction(newSnap);
      snapInteractionRef.current = newSnap;
    }
  }, [isSnapActive]);

  useEffect(() => {
    const allChecked = districts.filter((d) => d.checked);
    setParcelLoadedFeaturesCount(
      allChecked.reduce(
        (sum, d) => sum + (d.hasLoaded ? d.parcels.length : 0),
        0
      )
    );
    const completed = allChecked.filter((d) => d.hasLoaded).length;
    setParcelLoadingProgress(
      allChecked.length > 0
        ? Math.floor((completed / allChecked.length) * 100)
        : 0
    );
  }, [districts]);

  const parcelDistrictsLoading = useMemo(
    () => districts.some((d) => d.checked && d.loading),
    [districts]
  );
  const overallLoading = useMemo(
    () =>
      parcelDistrictsLoading ||
      layerStates.road.isLoading ||
      layerStates.building.isLoading,
    [parcelDistrictsLoading, layerStates]
  );
  const overallError = useMemo(() => {
    const parcelError = districts.find((d) => d.checked && d.error);
    if (parcelError) return `Parcel Load Error: ${parcelError.error}`;
    if (layerStates.road.error)
      return `Road Load Error: ${layerStates.road.error}`;
    if (layerStates.building.error)
      return `Building Load Error: ${layerStates.building.error}`;
    return null;
  }, [districts, layerStates]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-title-block">
          <h1>MSM Web GIS</h1>
          <p>ລະບົບຂໍ້ມູນພື້ນຖານທີ່ດິນແຫ່ງຊາດ</p>
        </div>
      </header>
      <main className="app-main">
        <div className="map-wrapper">
          <div ref={mapRef} className="map-container"></div>
          {openLayersLoadedState && (
            <>
              <LoadingBar
                isLoading={overallLoading}
                loadingProgress={parcelLoadingProgress}
              />
              {overallError && <ErrorOverlay errorMessage={overallError} />}
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
                onParcelSelect={setSelectedParcel}
                loadTrigger={loadTrigger}
              />
              <RoadLayer
                map={mapInstanceRef.current}
                isVisible={layerStates.road.isVisible}
                onLoadingChange={handleRoadLoadingChange}
                onErrorChange={handleRoadErrorChange}
              />
              <BuildingLayer
                map={mapInstanceRef.current}
                isVisible={layerStates.building.isVisible}
                onLoadingChange={handleBuildingLoadingChange}
                onErrorChange={handleBuildingErrorChange}
              />
              {selectedParcel && (
                <ParcelInfoPanel
                  parcel={selectedParcel}
                  onClose={() => setSelectedParcel(null)}
                />
              )}
              {mapInstanceRef.current && (
                <CoordinateBar map={mapInstanceRef.current} />
              )}
            </>
          )}
        </div>
        <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
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
          {!isSidebarCollapsed && (
            <>
              <div className="sidebar-section">
                <div className="sidebar-section-header">
                  <h3>ຊັ້ນຂໍ້ມູນ</h3>
                </div>
                <div className="layer-toggles-section">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={layerStates.road.isVisible}
                      onChange={(e) =>
                        updateLayerState("road", {
                          isVisible: e.target.checked,
                        })
                      }
                    />
                    <span>ເສັ້ນທາງ</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={layerStates.building.isVisible}
                      onChange={(e) =>
                        updateLayerState("building", {
                          isVisible: e.target.checked,
                        })
                      }
                    />
                    <span>ສິ່ງປຸກສ້າງ</span>
                  </label>
                </div>
              </div>
              <DistrictSelector
                districts={districts}
                onToggle={toggleDistrict}
                onLoadData={handleLoadData}
                isExpanded={isDistrictsExpanded}
                onToggleExpansion={() =>
                  setIsDistrictsExpanded(!isDistrictsExpanded)
                }
                selectedProvinceForDistricts={selectedProvinceForDistricts}
              />
              <ProvinceControls
                openLayersLoaded={openLayersLoadedState}
                isExpanded={isProvincesExpanded}
                onToggleExpansion={() =>
                  setIsProvincesExpanded(!isProvincesExpanded)
                }
                onProvinceSelectForMap={handleProvinceSelectionForMap}
              />
              <div className="footer">&copy; 2025 Web Mapping Application</div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default MapComponent;
