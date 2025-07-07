// App.jsx
import React, { useState, useMemo, useCallback } from "react";
import "ol/ol.css"; // ນໍາເຂົ້າໄຟລ໌ CSS ພື້ນຖານຂອງ OpenLayers
import "./index.css"; // ນໍາເຂົ້າໄຟລ໌ CSS ຂອງແອັບພລິເຄຊັນ
import { Globe } from "lucide-react"; // ນໍາເຂົ້າໄອຄອນ Globe ຈາກ lucide-react
import { fromLonLat } from "ol/proj"; // ນໍາເຂົ້າຟັງຊັນ fromLonLat ສໍາລັບການປ່ຽນລະບົບພິກັດ

// <<<<<<< HEAD
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
import { ChevronLeft, ChevronRight } from "lucide-react";

// ນໍາເຂົ້າຂໍ້ມູນ
import initialLaoDistricts from "./data/LaoDistrictsData"; // ຂໍ້ມູນເບື້ອງຕົ້ນຂອງເມືອງຕ່າງໆໃນລາວ

/**
 * ຄອມໂປເນັ້ນຫຼັກຂອງແອັບພລິເຄຊັ່ນ
 * Main application component
 */
function App() {
  // <<<<<<< HEAD
  // Map State - ສະຖານະການໃຊ້ງານແຜນທີ່
  const [viewInstance, setViewInstance] = useState(null);
  const [openLayersLoaded, setOpenLayersLoaded] = useState(false);
  const [selectedBaseMap, setSelectedBaseMap] = useState("OSM");

  // Data & Layer State - ສະຖານະຂໍ້ມູນແລະ Layer
  const [districts, setDistricts] = useState(initialLaoDistricts);
  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState("VientianeCapital"); // ແຂວງທີ່ຖືກເລືອກສໍາລັບການກັ່ນຕອງເມືອງ
  const [loadTrigger, setLoadTrigger] = useState(0); // ຕົວ trigger ເພື່ອໂຫຼດຂໍ້ມູນຕອນດິນ
  const [selectedParcel, setSelectedParcel] = useState(null); // ຕອນດິນທີ່ຖືກເລືອກ (ສໍາລັບສະແດງຂໍ້ມູນ)
  const [layerStates, setLayerStates] = useState({
    road: { isVisible: true, opacity: 1, isLoading: false, error: null }, // ສະຖານະຂອງຊັ້ນຂໍ້ມູນເສັ້ນທາງ
    building: { isVisible: true, opacity: 1, isLoading: false, error: null }, // ສະຖານະຂອງຊັ້ນຂໍ້ມູນອາຄານ
  });

  // <<<<<<< HEAD
  // Interaction State - ສະຖານະການໂຕ້ຕອບ
  const [interactionMode, setInteractionMode] = useState("None");
  const [isSnapActive, setIsSnapActive] = useState(false);

  // UI State - ສະຖານະ UI
  const [isProvincesExpanded, setProvincesExpanded] = useState(true);
  const [isDistrictsExpanded, setDistrictsExpanded] = useState(true);
  const [isLayersExpanded, setLayersExpanded] = useState(true);

  // Memoized callback object for MapComponent - ວັດຖຸທີ່ຈື່ຈຳສຳລັບ MapComponent

  // Derived State for Loading Bar - ສະຖານະທີ່ຄຳນວນມາສຳລັບ Loading Bar
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

  // Handlers - ຕົວຈັດການຕ່າງໆ
  const handleProvinceSelectionForMap = useCallback(
    (coords, zoom, provinceName) => {
      if (viewInstance) {
        viewInstance.animate({
          center: fromLonLat(coords), // ຕໍາແໜ່ງສູນກາງ
          zoom: zoom, // ລະດັບການຊູມ
          duration: 700, // ໄລຍະເວລາການເຄື່ອນໄຫວ
        });
        setSelectedProvinceForDistricts(provinceName); // ຕັ້ງແຂວງທີ່ຖືກເລືອກສໍາລັບການກັ່ນຕອງເມືອງ
      }
    },
    [viewInstance] // ຈະສ້າງຟັງຊັນຄືນໃໝ່ເມື່ອ viewInstance ປ່ຽນແປງ
  );

  // ຈັດການການປິດ/ເປີດຊັ້ນຂໍ້ມູນ
  const handleLayerVisibilityChange = useCallback((layerKey, isVisible) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerKey]: { ...prev[layerKey], isVisible }, // ອັບເດດຄ່າ isVisible
    }));
  }, []);

  // ຈັດການການປ່ຽນແປງຄວາມໂປ່ງໃສຂອງຊັ້ນຂໍ້ມູນ
  const handleLayerOpacityChange = useCallback((layerKey, opacity) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerKey]: { ...prev[layerKey], opacity }, // ອັບເດດຄ່າ opacity
    }));
  }, []);

  // ຈັດການການປິດ/ເປີດເມືອງ
  const toggleDistrict = useCallback((districtName) => {
    setDistricts((prevDistricts) =>
      prevDistricts.map((d) =>
        d.name === districtName ? { ...d, checked: !d.checked } : d
      )
    );
  }, []);

  // ຈັດການການປ່ຽນແປງຄວາມໂປ່ງໃສຂອງເມືອງ
  const handleDistrictOpacityChange = useCallback((districtName, opacity) => {
    setDistricts((prevDistricts) =>
      prevDistricts.map((d) =>
        d.name === districtName ? { ...d, opacity: parseFloat(opacity) } : d
      )
    );
  }, []);

  // ຈັດການການໂຫຼດຂໍ້ມູນຕອນດິນ
  const handleLoadData = useCallback(() => {
    setLoadTrigger((prev) => prev + 1); // ເພີ່ມຄ່າ loadTrigger ເພື່ອ trigger ການໂຫຼດຂໍ້ມູນ
  }, []);

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-title">
          <Globe size={20} style={{ marginRight: "10px" }} />
          ລະບົບຂໍ້ມູນພູມສາດ
        </div>
        <DrawingToolbar
          currentInteractionMode={interactionMode}
          onSetInteractionMode={setInteractionMode}
          isSnapActive={isSnapActive}
          onToggleSnap={() => setIsSnapActive((prev) => !prev)}
        />
      </div>

      <div classNamename="main-content">
        <MapComponent
          selectedBaseMap={selectedBaseMap}
          setSelectedBaseMap={setSelectedBaseMap}
          onMapLoaded={setViewInstance}
          interactionMode={interactionMode}
          isSnapActive={isSnapActive}
        >
          {" "}
          {/* ສົ່ງ map instance ໄປຍັງ children */}
          <ParcelLayerControl
            districts={districts}
            setDistricts={setDistricts}
            onParcelSelect={setSelectedParcel}
            loadTrigger={loadTrigger}
          />
          <RoadLayer
            isVisible={layerStates.road.isVisible}
            opacity={layerStates.road.opacity}
            onLoadingChange={(isLoading) =>
              setLayerStates((prev) => ({
                ...prev,
                road: { ...prev.road, isLoading },
              }))
            }
            onErrorChange={(error) =>
              setLayerStates((prev) => ({
                ...prev,
                road: { ...prev.road, error, isLoading: false },
              }))
            }
          />
          <BuildingLayer
            isVisible={layerStates.building.isVisible}
            opacity={layerStates.building.opacity}
            onLoadingChange={(isLoading) =>
              setLayerStates((prev) => ({
                ...prev,
                building: { ...prev.building, isLoading },
              }))
            }
            onErrorChange={(error) =>
              setLayerStates((prev) => ({
                ...prev,
                building: { ...prev.building, error, isLoading: false },
              }))
            }
          />
          {overallLoading && (
            <LoadingBar
              isLoading={overallLoading}
              loadingProgress={progress}
              loadedFeaturesCount={loadedFeaturesCount}
            />
          )}
        </MapComponent>

        <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>

          <div className="sidebar-section">
            <div className="sidebar-section-header">🗺 Map Layers</div>
            <LayerToggles
              layerStates={layerStates}
              onVisibilityChange={handleLayerVisibilityChange}
              onOpacityChange={handleLayerOpacityChange}
              isExpanded={isLayersExpanded}
              onToggleExpansion={() => setLayersExpanded((e) => !e)}
            />
          </div>
          <div className="sidebar-section">
            <ProvinceControls
              openLayersLoaded={openLayersLoaded}
              onProvinceSelectForMap={handleProvinceSelectionForMap}
              isExpanded={isProvincesExpanded}
              onToggleExpansion={() => setProvincesExpanded((e) => !e)}
            />
          </div>
          <div className="sidebar-section">
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
