import React, { useState, useMemo, useCallback } from "react";
import "ol/ol.css";
import { Globe } from "lucide-react";

import MapComponent from "./MapComponent";
import ProvinceControls from "./components/ui/ProvinceControls";
import DistrictSelector from "./components/ui/DistrictSelector";
import LoadingBar from "./LoadingBar";
import ParcelLayerControl from "./components/map/ParcelLayerControl";
import ParcelInfoPanel from "./components/ui/ParcelInfoPanel";
import DrawingToolbar from "./components/ui/DrawingToolbar";
import BaseMapSwitcher from "./components/map/BaseMapSwitcher";
import initialLaoDistricts from "./data/LaoDistrictsData";

function App() {
  const [openLayersLoaded, setOpenLayersLoaded] = useState(false);
  const [viewInstance, setViewInstance] = useState(null);
  const [selectedBaseMap, setSelectedBaseMap] = useState("OSM");

  const [districts, setDistricts] = useState(initialLaoDistricts);
  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState("VientianeCapital");
  const [loadTrigger, setLoadTrigger] = useState(0);
  const [selectedParcel, setSelectedParcel] = useState(null);

  const [interactionMode, setInteractionMode] = useState("None");
  const [isSnapActive, setIsSnapActive] = useState(false);

  const onMapLoaded = useMemo(
    () => ({
      setOpenLayersLoaded,
      setViewInstance,
    }),
    []
  );

  const overallLoading = useMemo(
    () => districts.some((d) => d.loading),
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

  const handleProvinceSelectionForMap = useCallback(
    (coords, zoom, provinceName) => {
      if (viewInstance) {
        viewInstance.animate({ center: coords, zoom, duration: 1000 });
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

  const handleLoadData = useCallback(() => setLoadTrigger((c) => c + 1), []);

  const handleSetInteractionMode = (mode) => {
    setInteractionMode((current) => (current === mode ? "None" : mode));
  };

  const handleToggleSnap = () => setIsSnapActive((prev) => !prev);

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

      <main className="app-main">
        <MapComponent
          onMapLoaded={onMapLoaded}
          selectedBaseMap={selectedBaseMap}
          interactionMode={interactionMode}
          isSnapActive={isSnapActive}
        >
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
          <ProvinceControls
            openLayersLoaded={openLayersLoaded}
            onProvinceSelectForMap={handleProvinceSelectionForMap}
            isExpanded={true}
          />
          <DistrictSelector
            districts={districts}
            onToggle={toggleDistrict}
            onLoadData={handleLoadData}
            selectedProvinceForDistricts={selectedProvinceForDistricts}
            isExpanded={true}
          />
        </div>

        {selectedParcel && (
          <ParcelInfoPanel
            parcel={selectedParcel}
            onClose={() => setSelectedParcel(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
