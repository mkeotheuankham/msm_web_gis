import React, { useState, useMemo, useCallback } from "react";
import "ol/ol.css";
import "./index.css";
import { Globe } from "lucide-react";
import { fromLonLat } from "ol/proj";

// Import Components
import MapComponent from "./MapComponent";
import ProvinceControls from "./components/ui/ProvinceControls";
import DistrictSelector from "./components/ui/DistrictSelector";
import LoadingBar from "./LoadingBar";
import ParcelLayerControl from "./components/map/ParcelLayerControl";
import ParcelInfoPanel from "./components/ui/ParcelInfoPanel";
import DrawingToolbar from "./components/ui/DrawingToolbar";
import BaseMapSwitcher from "./components/map/BaseMapSwitcher";
import LayerToggles from "./components/ui/LayerToggles";
import RoadLayer from "./components/map/RoadLayer";
import BuildingLayer from "./components/map/BuildingLayer";

// Import Data
import initialLaoDistricts from "./data/LaoDistrictsData";

function App() {
  // Map State
  const [viewInstance, setViewInstance] = useState(null);
  const [openLayersLoaded, setOpenLayersLoaded] = useState(false);
  const [selectedBaseMap, setSelectedBaseMap] = useState("OSM");

  // Data & Layer State
  const [districts, setDistricts] = useState(initialLaoDistricts);
  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState("VientianeCapital");
  const [loadTrigger, setLoadTrigger] = useState(0);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [layerStates, setLayerStates] = useState({
    road: { isVisible: true, opacity: 1, isLoading: false, error: null },
    building: { isVisible: true, opacity: 1, isLoading: false, error: null },
  });

  // Interaction State
  const [interactionMode, setInteractionMode] = useState("None");
  const [isSnapActive, setIsSnapActive] = useState(false);

  // UI State
  const [isProvincesExpanded, setProvincesExpanded] = useState(true);
  const [isDistrictsExpanded, setDistrictsExpanded] = useState(true);
  const [isLayersExpanded, setLayersExpanded] = useState(true);

  // Memoized callback object for MapComponent
  const onMapLoaded = useMemo(
    () => ({ setViewInstance, setOpenLayersLoaded }),
    []
  );

  // Derived State for Loading Bar
  const overallLoading = useMemo(
    () => districts.some((d) => d.checked && d.loading),
    [districts]
  );
  const loadedFeaturesCount = useMemo(
    () => districts.reduce((acc, d) => acc + (d.parcels?.length || 0), 0),
    [districts]
  );
  const progress = useMemo(() => {
    const checkedDistricts = districts.filter((d) => d.checked);
    if (checkedDistricts.length === 0) return 0;
    const loadedCount = checkedDistricts.filter(
      (d) => d.hasLoaded || d.error
    ).length;
    return (loadedCount / checkedDistricts.length) * 100;
  }, [districts]);

  // Handlers
  const handleProvinceSelectionForMap = useCallback(
    (coords, zoom, provinceName) => {
      if (viewInstance) {
        viewInstance.animate({
          center: fromLonLat(coords),
          zoom,
          duration: 1000,
        });
      }
      setSelectedProvinceForDistricts(provinceName);
    },
    [viewInstance]
  );

  const toggleDistrict = useCallback((districtName) => {
    setDistricts((prev) =>
      prev.map((d) =>
        d.name === districtName ? { ...d, checked: !d.checked } : d
      )
    );
  }, []);

  const handleDistrictOpacityChange = useCallback((districtName, opacity) => {
    setDistricts((prev) =>
      prev.map((d) =>
        d.name === districtName ? { ...d, opacity: parseFloat(opacity) } : d
      )
    );
  }, []);

  const handleLoadData = useCallback(() => setLoadTrigger((c) => c + 1), []);
  const handleSetInteractionMode = (mode) =>
    setInteractionMode((current) => (current === mode ? "None" : mode));
  const handleToggleSnap = () => setIsSnapActive((prev) => !prev);

  const handleLayerVisibilityChange = (layerName, isVisible) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerName]: { ...prev[layerName], isVisible },
    }));
  };

  const handleLayerOpacityChange = (layerName, opacity) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerName]: { ...prev[layerName], opacity },
    }));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-section-left">
          <Globe className="logo-icon" size={26} />
          <h1>MSM Web GIS</h1>
          <div className="toolbar-separator"></div>
          <DrawingToolbar
            currentInteractionMode={interactionMode}
            onSetInteractionMode={handleSetInteractionMode}
            isSnapActive={isSnapActive}
            onToggleSnap={handleToggleSnap}
          />
        </div>
        <div className="header-section-right">
          <BaseMapSwitcher
            selectedBaseMap={selectedBaseMap}
            onSelectBaseMap={setSelectedBaseMap}
          />
        </div>
      </header>

      <div className="app-main">
        <MapComponent
          onMapLoaded={onMapLoaded}
          selectedBaseMap={selectedBaseMap}
          interactionMode={interactionMode}
          isSnapActive={isSnapActive}
        >
          <RoadLayer
            isVisible={layerStates.road.isVisible}
            opacity={layerStates.road.opacity}
          />
          <BuildingLayer
            isVisible={layerStates.building.isVisible}
            opacity={layerStates.building.opacity}
          />
          <ParcelLayerControl
            districts={districts}
            setDistricts={setDistricts}
            loadTrigger={loadTrigger}
            onParcelSelect={setSelectedParcel}
          />
          {overallLoading && (
            <LoadingBar
              isLoading={overallLoading}
              loadingProgress={progress}
              loadedFeaturesCount={loadedFeaturesCount}
            />
          )}
        </MapComponent>

        <div className="sidebar">
          <LayerToggles
            layerStates={layerStates}
            onVisibilityChange={handleLayerVisibilityChange}
            onOpacityChange={handleLayerOpacityChange}
            isExpanded={isLayersExpanded}
            onToggleExpansion={() => setLayersExpanded((e) => !e)}
          />
          <ProvinceControls
            openLayersLoaded={openLayersLoaded}
            onProvinceSelectForMap={handleProvinceSelectionForMap}
            isExpanded={isProvincesExpanded}
            onToggleExpansion={() => setProvincesExpanded((e) => !e)}
          />
          <DistrictSelector
            districts={districts}
            onToggle={toggleDistrict}
            onLoadData={handleLoadData}
            onOpacityChange={handleDistrictOpacityChange}
            selectedProvinceForDistricts={selectedProvinceForDistricts}
            isExpanded={isDistrictsExpanded}
            onToggleExpansion={() => setDistrictsExpanded((e) => !e)}
          />
        </div>

        {selectedParcel && (
          <ParcelInfoPanel
            parcel={selectedParcel}
            onClose={() => setSelectedParcel(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
