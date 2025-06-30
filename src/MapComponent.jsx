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
import { unByKey } from "ol/Observable";
import initialLaoDistricts from "./data/LaoDistrictsData";

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

const areExtentsEqual = (ext1, ext2) => {
  if (!ext1 || !ext2) return ext1 === ext2;
  if (ext1.length !== ext2.length) return false;
  for (let i = 0; i < ext1.length; i++) {
    if (ext1[i] !== ext2[i]) return false;
  }
  return true;
};

function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const viewInstanceRef = useRef(null);
  const extentListenerKeys = useRef([]);

  const vectorSourceRef = useRef(new VectorSource());
  const drawRef = useRef(null);
  const [selectedBaseMap, setSelectedBaseMap] = useState("OSM");
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);

  const [centerState] = useState(fromLonLat([103.85, 18.2]));
  const [zoomState] = useState(7);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);

  const [isDistrictsExpanded, setIsDistrictsExpanded] = useState(true);
  const [isProvincesExpanded, setIsProvincesExpanded] = useState(true);

  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState(null);
  const [selectedProvinceForRoads, setSelectedProvinceForRoads] =
    useState(null);
  const [selectedDistrictForBuildings, setSelectedDistrictForBuildings] =
    useState(null);

  const [loadTrigger, setLoadTrigger] = useState(0);

  const [layerStates, setLayerStates] = useState({
    road: { isVisible: false, isLoading: false, error: null },
    building: { isVisible: false, isLoading: false, error: null },
  });

  const [districts, setDistricts] = useState(initialLaoDistricts);

  const updateLayerState = useCallback((layerName, newState) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerName]: { ...prev[layerName], ...newState },
    }));
  }, []);

  const handleRoadLoadingChange = useCallback(
    (isLoading) => {
      updateLayerState("road", { isLoading });
    },
    [updateLayerState]
  );

  const handleRoadErrorChange = useCallback(
    (error) => {
      updateLayerState("road", { error });
    },
    [updateLayerState]
  );

  const handleBuildingLoadingChange = useCallback(
    (isLoading) => {
      updateLayerState("building", { isLoading });
    },
    [updateLayerState]
  );

  const handleBuildingErrorChange = useCallback(
    (error) => {
      updateLayerState("building", { error });
    },
    [updateLayerState]
  );

  const [parcelDistrictsLoading, setParcelDistrictsLoading] = useState(false);
  const [parcelLoadingProgress, setParcelLoadingProgress] = useState(0);
  const [parcelLoadedFeaturesCount, setParcelLoadedFeaturesCount] = useState(0);
  const [currentMapExtent, setCurrentMapExtent] = useState(null);
  const drawingToolbarRef = useRef(null);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const toggleDistrict = useCallback((districtName) => {
    setDistricts((prevDistricts) =>
      prevDistricts.map((d) =>
        d.name === districtName ? { ...d, checked: !d.checked } : d
      )
    );
  }, []);

  const handleLoadData = useCallback(() => {
    setLoadTrigger((c) => c + 1);
  }, []);

  const handleProvinceSelectionForMap = useCallback(
    (coords, zoom, provinceName) => {
      if (
        mapInstanceRef.current &&
        viewInstanceRef.current &&
        openLayersLoadedState
      ) {
        viewInstanceRef.current.animate({
          center: coords,
          zoom: zoom,
          duration: 1000,
        });
      }
      setSelectedProvinceForDistricts(provinceName);
      setSelectedProvinceForRoads(provinceName);
    },
    [openLayersLoadedState]
  );

  const updateMapExtentCore = useCallback(
    (view) => {
      if (view && typeof view.getExtent === "function") {
        try {
          const extent3857 = view.getExtent();
          const bottomLeft = toLonLat([extent3857[0], extent3857[1]]);
          const topRight = toLonLat([extent3857[2], extent3857[3]]);
          const newExtent = [
            parseFloat(bottomLeft[0].toFixed(4)),
            parseFloat(bottomLeft[1].toFixed(4)),
            parseFloat(topRight[0].toFixed(4)),
            parseFloat(topRight[1].toFixed(4)),
          ];
          if (!areExtentsEqual(currentMapExtent, newExtent)) {
            setCurrentMapExtent(newExtent);
          }
        } catch (error) {
          console.error("[MapComponent] Error getting map extent:", error);
          setCurrentMapExtent(null);
        }
      } else {
        console.warn(
          "[MapComponent] view or view.getExtent is not available during extent update."
        );
      }
    },
    [currentMapExtent]
  );

  const debouncedUpdateMapExtent = useMemo(
    () => debounce(updateMapExtentCore, 250),
    [updateMapExtentCore]
  );

  useEffect(() => {
    let map;
    let resizeObserver;
    const currentMapContainer = mapRef.current;
    if (!currentMapContainer) return;
    const initOpenLayersMap = () => {
      if (
        currentMapContainer.clientWidth === 0 ||
        currentMapContainer.clientHeight === 0
      ) {
        setTimeout(initOpenLayersMap, 100);
        return;
      }
      if (mapInstanceRef.current) return;
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
      const initialView = new View({
        center: centerState,
        zoom: zoomState,
        minZoom: 2,
        maxZoom: 22,
      });
      map = new Map({
        target: currentMapContainer,
        layers: [osmLayer, googleSatLayer, googleHybridLayer],
        view: initialView,
        controls: defaultControls(),
        interactions: defaultInteractions(),
        pixelRatio: 1,
      });
      mapInstanceRef.current = map;
      viewInstanceRef.current = initialView;
      const keys = [
        initialView.on("change:center", () =>
          debouncedUpdateMapExtent(initialView)
        ),
        initialView.on("change:resolution", () =>
          debouncedUpdateMapExtent(initialView)
        ),
        map.on("moveend", () => debouncedUpdateMapExtent(initialView)),
      ];
      extentListenerKeys.current = keys;

      // --- FIX: Use 'rendercomplete' for the first extent calculation ---
      map.once("rendercomplete", () => {
        if (viewInstanceRef.current) {
          console.log(
            "Map initial render complete. Calculating initial extent."
          );
          debouncedUpdateMapExtent(viewInstanceRef.current);
        }
      });

      setOpenLayersLoadedState(true);
      resizeObserver = new ResizeObserver(() => map.updateSize());
      resizeObserver.observe(currentMapContainer);
    };
    initOpenLayersMap();
    return () => {
      extentListenerKeys.current.forEach(unByKey);
      extentListenerKeys.current = [];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
      viewInstanceRef.current = null;
      if (currentMapContainer && resizeObserver) {
        resizeObserver.unobserve(currentMapContainer);
      }
    };
  }, [debouncedUpdateMapExtent, centerState, zoomState]);

  useEffect(() => {
    if (mapInstanceRef.current && openLayersLoadedState) {
      const timer = setTimeout(() => mapInstanceRef.current.updateSize(), 300);
      return () => clearTimeout(timer);
    }
  }, [isSidebarCollapsed, openLayersLoadedState]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    let vectorLayer = map
      .getLayers()
      .getArray()
      .find((l) => l.get("name") === "drawing_layer");
    if (!vectorLayer) {
      vectorLayer = new VectorLayer({
        source: vectorSourceRef.current,
        style: new Style({
          fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
          stroke: new Stroke({ color: "#ffcc33", width: 2 }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: "#ffcc33" }),
          }),
        }),
        properties: { name: "drawing_layer" },
      });
      map.addLayer(vectorLayer);
    }
    if (drawRef.current) map.removeInteraction(drawRef.current);
    if (drawingMode) {
      const drawInteraction = new Draw({
        source: vectorSourceRef.current,
        type: drawingMode === "Box" ? "Circle" : drawingMode,
        geometryFunction: drawingMode === "Box" ? createBox() : undefined,
      });
      map.addInteraction(drawInteraction);
      drawRef.current = drawInteraction;
    }
    return () => {
      if (drawRef.current) {
        if (map) map.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [drawingMode]);

  const clearDrawing = () => vectorSourceRef.current.clear();

  useEffect(() => {
    const activelyLoadingDistricts = districts.filter(
      (d) => d.checked && d.loading
    );
    const allCheckedDistricts = districts.filter((d) => d.checked);
    const completedCheckedDistricts = allCheckedDistricts.filter(
      (d) => d.hasLoaded
    ).length;
    const totalCheckedCount = allCheckedDistricts.length;
    let progress =
      totalCheckedCount > 0
        ? Math.floor((completedCheckedDistricts / totalCheckedCount) * 100)
        : 0;
    let totalFeaturesLoaded = allCheckedDistricts.reduce(
      (sum, d) => sum + (d.hasLoaded && d.parcels ? d.parcels.length : 0),
      0
    );
    setParcelDistrictsLoading(activelyLoadingDistricts.length > 0);
    setParcelLoadingProgress(progress);
    setParcelLoadedFeaturesCount(totalFeaturesLoaded);
  }, [districts]);

  useEffect(() => {
    const currentlyCheckedDistrict = districts.find((d) => d.checked);
    if (layerStates.building.isVisible) {
      setSelectedDistrictForBuildings(
        currentlyCheckedDistrict ? currentlyCheckedDistrict.name : null
      );
    } else {
      setSelectedDistrictForBuildings(null);
    }
  }, [layerStates.building.isVisible, districts]);

  const overallLoading = useMemo(
    () =>
      (layerStates.road.isVisible && layerStates.road.isLoading) ||
      (layerStates.building.isVisible && layerStates.building.isLoading) ||
      parcelDistrictsLoading,
    [layerStates.road, layerStates.building, parcelDistrictsLoading]
  );
  const overallProgress = useMemo(() => {
    if (parcelDistrictsLoading) return parcelLoadingProgress;
    if (layerStates.road.isVisible && layerStates.road.isLoading) return 50;
    if (layerStates.building.isVisible && layerStates.building.isLoading)
      return 50;
    if (!overallLoading && openLayersLoadedState) return 100;
    return 0;
  }, [
    parcelDistrictsLoading,
    parcelLoadingProgress,
    layerStates,
    overallLoading,
    openLayersLoadedState,
  ]);
  const overallError = useMemo(() => {
    if (layerStates.road.error) return layerStates.road.error;
    if (layerStates.building.error) return layerStates.building.error;
    const parcelErrorDistrict = districts.find((d) => d.checked && d.error);
    return parcelErrorDistrict
      ? `ຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນດິນແຫ່ງ ${parcelErrorDistrict.displayName}: ${parcelErrorDistrict.error}`
      : null;
  }, [layerStates, districts]);

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
                loadingProgress={overallProgress}
                loadedFeaturesCount={parcelLoadedFeaturesCount}
              />
              {overallError && (
                <ErrorOverlay
                  errorMessage={overallError}
                  style={{ top: "3.5rem" }}
                />
              )}
              <BaseMapSwitcher
                map={mapInstanceRef.current}
                selectedBaseMap={selectedBaseMap}
                onSelectBaseMap={setSelectedBaseMap}
                isSidebarCollapsed={isSidebarCollapsed}
              />
              <DrawingToolbar
                ref={drawingToolbarRef}
                onSelectDrawingMode={setDrawingMode}
                onClearDrawing={clearDrawing}
                currentMode={drawingMode}
                initialPosition={{ x: 50, y: 50 }}
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
                selectedProvince={selectedProvinceForRoads}
                mapExtent={currentMapExtent}
                onLoadingChange={handleRoadLoadingChange}
                onErrorChange={handleRoadErrorChange}
              />
              <BuildingLayer
                map={mapInstanceRef.current}
                isVisible={layerStates.building.isVisible}
                selectedDistrict={selectedDistrictForBuildings}
                mapExtent={currentMapExtent}
                onLoadingChange={handleBuildingLoadingChange}
                onErrorChange={handleBuildingErrorChange}
              />
            </>
          )}
          {selectedParcel && (
            <ParcelInfoPanel
              parcel={selectedParcel}
              onClose={() => setSelectedParcel(null)}
            />
          )}

          {mapInstanceRef.current && (
            <CoordinateBar
              map={mapInstanceRef.current}
              parcelLoadedFeaturesCount={parcelLoadedFeaturesCount}
              layerStates={layerStates}
            />
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
              <div className="layer-toggles-section">
                <h3>ຊັ້ນຂໍ້ມູນ</h3>
                <div className="toggle-group">
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
                isSidebarCollapsed={isSidebarCollapsed}
                isExpanded={isDistrictsExpanded}
                onToggleExpansion={() =>
                  setIsDistrictsExpanded(!isDistrictsExpanded)
                }
                selectedProvinceForDistricts={selectedProvinceForDistricts}
              />
              <ProvinceControls
                openLayersLoaded={openLayersLoadedState}
                isSidebarCollapsed={isSidebarCollapsed}
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
