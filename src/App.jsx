// src/App.jsx

import React, { useState, useCallback, useMemo, useEffect } from "react";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import { PanelLeft, PanelRight, AlertCircle } from "lucide-react";

import MapComponent from "./MapComponent";
import ProvinceControls from "./components/ui/ProvinceControls";
import DistrictSelector from "./components/ui/DistrictSelector";
import LoadingBar from "./LoadingBar";
import initialLaoDistricts from "./data/LaoDistrictsData";

const ErrorOverlay = ({ errorMessage }) => {
  if (!errorMessage) return null;
  return (
    <div className="map-overlay-status error">
      <AlertCircle size={24} style={{ marginRight: "8px" }} />
      ຂໍ້ຜິດພາດ: {errorMessage}
    </div>
  );
};

function App() {
  const [openLayersLoaded, setOpenLayersLoaded] = useState(false);
  const [viewInstance, setViewInstance] = useState(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isDistrictsExpanded, setIsDistrictsExpanded] = useState(true);
  const [isProvincesExpanded, setIsProvincesExpanded] = useState(true);

  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState("VientianeCapital");
  const [loadTrigger, setLoadTrigger] = useState(0);

  const [layerStates, setLayerStates] = useState({
    road: { isVisible: false, isLoading: false, error: null }, // <-- ປ່ຽນເປັນ false
    building: { isVisible: false, isLoading: false, error: null }, // <-- ປ່ຽນເປັນ false
  });
  const [districts, setDistricts] = useState(initialLaoDistricts);
  const [selectedBaseMap, setSelectedBaseMap] = useState("OSM");

  const [parcelLoadingProgress, setParcelLoadingProgress] = useState(0);
  const [parcelLoadedFeaturesCount, setParcelLoadedFeaturesCount] = useState(0);

  // FIX 1: Use useMemo to stabilize the onMapLoaded prop object
  const onMapLoaded = useMemo(
    () => ({
      setViewInstance,
      setOpenLayersLoaded,
    }),
    []
  ); // Empty dependency array ensures it's created only once

  const updateLayerState = useCallback((layerName, newState) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerName]: { ...prev[layerName], ...newState },
    }));
  }, []);

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

  const handleProvinceSelectionForMap = useCallback(
    (coords, zoom, provinceName) => {
      if (viewInstance) {
        viewInstance.animate({
          center: fromLonLat(coords),
          zoom: zoom,
          duration: 1000,
        });
      }
      setSelectedProvinceForDistricts(provinceName);
    },
    [viewInstance]
  );

  useEffect(() => {
    const allChecked = districts.filter((d) => d.checked);
    if (allChecked.length === 0) {
      setParcelLoadingProgress(0);
      setParcelLoadedFeaturesCount(0);
      return;
    }
    const completed = allChecked.filter((d) => d.hasLoaded).length;
    setParcelLoadedFeaturesCount(
      allChecked.reduce((sum, d) => sum + (d.parcels?.length || 0), 0)
    );
    setParcelLoadingProgress(Math.floor((completed / allChecked.length) * 100));
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
        <MapComponent
          onMapLoaded={onMapLoaded}
          districts={districts}
          setDistricts={setDistricts}
          layerStates={layerStates}
          updateLayerState={updateLayerState}
          onParcelSelect={setSelectedParcel}
          selectedParcel={selectedParcel}
          loadTrigger={loadTrigger}
          selectedBaseMap={selectedBaseMap}
          setSelectedBaseMap={setSelectedBaseMap}
        >
          <LoadingBar
            isLoading={overallLoading}
            loadingProgress={parcelLoadingProgress}
            loadedFeaturesCount={parcelLoadedFeaturesCount}
          />
          {overallError && <ErrorOverlay errorMessage={overallError} />}
        </MapComponent>

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
                openLayersLoaded={openLayersLoaded}
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

export default App;
