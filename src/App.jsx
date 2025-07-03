import React, { useState, useMemo, useCallback } from "react";
import "ol/ol.css"; // ນໍາເຂົ້າໄຟລ໌ CSS ພື້ນຖານຂອງ OpenLayers
import "./index.css"; // ນໍາເຂົ້າໄຟລ໌ CSS ຂອງແອັບພລິເຄຊັນ
import { Globe } from "lucide-react"; // ນໍາເຂົ້າໄອຄອນ Globe ຈາກ lucide-react
import { fromLonLat } from "ol/proj"; // ນໍາເຂົ້າຟັງຊັນ fromLonLat ສໍາລັບການປ່ຽນລະບົບພິກັດ

// ນໍາເຂົ້າ Components ຕ່າງໆ
import MapComponent from "./MapComponent"; // Component ສໍາລັບແຜນທີ່ OpenLayers
import ProvinceControls from "./components/ui/ProvinceControls"; // Component ສໍາລັບການຄວບຄຸມແຂວງ
import DistrictSelector from "./components/ui/DistrictSelector"; // Component ສໍາລັບການເລືອກເມືອງ
import LoadingBar from "./LoadingBar"; // Component ສໍາລັບແຖບໂຫຼດຂໍ້ມູນ
import ParcelLayerControl from "./components/map/ParcelLayerControl"; // Component ສໍາລັບການຄວບຄຸມຊັ້ນຂໍ້ມູນຕອນດິນ
import ParcelInfoPanel from "./components/ui/ParcelInfoPanel"; // Component ສໍາລັບສະແດງຂໍ້ມູນຕອນດິນ
import DrawingToolbar from "./components/ui/DrawingToolbar"; // Component ສໍາລັບແຖບເຄື່ອງມືແຕ້ມ
import BaseMapSwitcher from "./components/map/BaseMapSwitcher"; // Component ສໍາລັບປ່ຽນແຜນທີ່ພື້ນຖານ
import LayerToggles from "./components/ui/LayerToggles"; // Component ສໍາລັບປິດ/ເປີດ ແລະປັບຄວາມໂປ່ງໃສຂອງຊັ້ນຂໍ້ມູນ
import RoadLayer from "./components/map/RoadLayer"; // Component ສໍາລັບຊັ້ນຂໍ້ມູນເສັ້ນທາງ
import BuildingLayer from "./components/map/BuildingLayer"; // Component ສໍາລັບຊັ້ນຂໍ້ມູນອາຄານ

// ນໍາເຂົ້າຂໍ້ມູນ
import initialLaoDistricts from "./data/LaoDistrictsData"; // ຂໍ້ມູນເບື້ອງຕົ້ນຂອງເມືອງຕ່າງໆໃນລາວ

function App() {
  // ສະຖານະຂອງແຜນທີ່ (Map State)
  const [viewInstance, setViewInstance] = useState(null); // Instance ຂອງ View ຂອງແຜນທີ່
  const [openLayersLoaded, setOpenLayersLoaded] = useState(false); // ບອກວ່າ OpenLayers ໂຫຼດແລ້ວບໍ
  const [selectedBaseMap, setSelectedBaseMap] = useState("OSM"); // ແຜນທີ່ພື້ນຖານທີ່ຖືກເລືອກ (ຄ່າເລີ່ມຕົ້ນ: OSM)

  // ສະຖານະຂໍ້ມູນ ແລະ ຊັ້ນຂໍ້ມູນ (Data & Layer State)
  const [districts, setDistricts] = useState(initialLaoDistricts); // ບັນຊີລາຍຊື່ຂອງເມືອງຕ່າງໆ
  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState("VientianeCapital"); // ແຂວງທີ່ຖືກເລືອກສໍາລັບການກັ່ນຕອງເມືອງ
  const [loadTrigger, setLoadTrigger] = useState(0); // ຕົວ trigger ເພື່ອໂຫຼດຂໍ້ມູນຕອນດິນ
  const [selectedParcel, setSelectedParcel] = useState(null); // ຕອນດິນທີ່ຖືກເລືອກ (ສໍາລັບສະແດງຂໍ້ມູນ)
  const [layerStates, setLayerStates] = useState({
    road: { isVisible: true, opacity: 1, isLoading: false, error: null }, // ສະຖານະຂອງຊັ້ນຂໍ້ມູນເສັ້ນທາງ
    building: { isVisible: true, opacity: 1, isLoading: false, error: null }, // ສະຖານະຂອງຊັ້ນຂໍ້ມູນອາຄານ
  });

  // ສະຖານະການໂຕ້ຕອບ (Interaction State)
  const [interactionMode, setInteractionMode] = useState("None"); // ໂຫມດການໂຕ້ຕອບຂອງແຜນທີ່ (ແຕ້ມ, ແກ້ໄຂ, ບໍ່ມີ)
  const [isSnapActive, setIsSnapActive] = useState(false); // ສະຖານະການເປີດ/ປິດ Snap (ການຕິດ)

  // ສະຖານະ UI (UI State)
  const [isProvincesExpanded, setProvincesExpanded] = useState(true); // ສະຖານະການຂະຫຍາຍ/ຫຍໍ້ຂອງ ProvinceControls
  const [isDistrictsExpanded, setDistrictsExpanded] = useState(true); // ສະຖານະການຂະຫຍາຍ/ຫຍໍ້ຂອງ DistrictSelector
  const [isLayersExpanded, setLayersExpanded] = useState(true); // ສະຖານະການຂະຫຍາຍ/ຫຍໍ້ຂອງ LayerToggles

  // Callback ທີ່ຖືກຈົດຈໍາໄວ້ສໍາລັບການຈັດການການໂຫຼດຂໍ້ມູນ
  const { overallLoading, progress, loadedFeaturesCount } = useMemo(() => {
    let totalLoading = 0;
    let totalFeatures = 0;
    let loadedFeatures = 0;

    // ຄິດໄລ່ສະຖານະການໂຫຼດຂອງເມືອງຕ່າງໆ
    districts.forEach((d) => {
      if (d.checked) {
        totalLoading++;
        if (d.hasLoaded || d.error) {
          totalFeatures++;
        }
        if (d.hasLoaded) {
          loadedFeatures++;
        }
      }
    });

    // ຄິດໄລ່ສະຖານະການໂຫຼດຂອງຊັ້ນຂໍ້ມູນ Road ແລະ Building
    Object.values(layerStates).forEach((state) => {
      if (state.isVisible && state.isLoading) {
        totalLoading++; // ຖືວ່າເປັນການໂຫຼດທີ່ດໍາເນີນຢູ່
      }
      if (state.isVisible && (state.hasLoaded || state.error)) {
        totalFeatures++; // ຖືວ່າເປັນຊັ້ນຂໍ້ມູນທີ່ໂຫຼດແລ້ວ ຫຼື ມີຂໍ້ຜິດພາດ
      }
      if (state.isVisible && state.hasLoaded) {
        loadedFeatures++; // ຖືວ່າເປັນຊັ້ນຂໍ້ມູນທີ່ໂຫຼດສໍາເລັດ
      }
    });

    const isLoading =
      totalLoading > 0 ||
      Object.values(layerStates).some((s) => s.isLoading) ||
      districts.some((d) => d.loading); // ກວດເບິ່ງວ່າກຳລັງໂຫຼດຢູ່ທັງໝົດບໍ

    const currentProgress =
      totalLoading > 0 ? (loadedFeatures / totalLoading) * 100 : 100; // ຄິດໄລ່ຄວາມຄືບໜ້າ

    return {
      overallLoading: isLoading, // ສະຖານະການໂຫຼດໂດຍລວມ
      progress: currentProgress, // ຄວາມຄືບໜ້າການໂຫຼດ (ເປັນເປີເຊັນ)
      loadedFeaturesCount: loadedFeatures, // ຈໍານວນລາຍການທີ່ໂຫຼດແລ້ວ
    };
  }, [districts, layerStates]); // ຈະຄິດໄລ່ຄືນໃໝ່ເມື່ອ districts ຫຼື layerStates ປ່ຽນແປງ

  // ຈັດການການເລືອກແຂວງສໍາລັບແຜນທີ່ (ຍ້າຍແຜນທີ່ໄປທີ່ແຂວງທີ່ເລືອກ)
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
