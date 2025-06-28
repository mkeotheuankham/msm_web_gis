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
import LoadingBar from "./LoadingBar"; // ນໍາເຂົ້າ LoadingBar

import { PanelLeft, PanelRight } from "lucide-react";

function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const drawRef = useRef(null);
  const [selectedBaseMap, setSelectedBaseMap] = useState("osm");
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);
  const [centerState, setCenterState] = useState(fromLonLat([102.6, 17.97]));
  const [zoomState, setZoomState] = useState(12);
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

  const [isRoadLayerVisible, setIsRoadLayerVisible] = useState(false);
  const [isBuildingLayerVisible, setIsBuildingLayerVisible] = useState(false);

  // States for Loading Bar (for overall data load)
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoadProgress, setDataLoadProgress] = useState(0);
  // State ໃໝ່ເພື່ອຕິດຕາມຈໍານວນ Features ທີ່ໂຫຼດສຳເລັດແລ້ວ
  const [currentLoadedFeaturesCount, setCurrentLoadedFeaturesCount] =
    useState(0);

  const [toolbarPosition, setToolbarPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const toolbarRef = useRef(null);

  const [districts, setDistricts] = useState([
    {
      name: "chanthabury",
      displayName: "ຈັນທະບູລີ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/chanthabury", // ໃຊ້ URL ເຕັມ
      dataKey: "cadastre_parcel_details_0101",
      checked: false,
      parcels: [], // ຈະເກັບ Features ທີ່ໂຫຼດມາແລ້ວ
      loading: false, // ສະຖານະການໂຫຼດສໍາລັບແຕ່ລະເມືອງ
      error: null, // ສະຖານະ error ສໍາລັບແຕ່ລະເມືອງ
      color: "#3388ff",
      hasLoaded: false, // ສະຖານະວ່າຂໍ້ມູນສຳລັບເມືອງນີ້ເຄີຍຖືກໂຫຼດສຳເລັດແລ້ວຫຼືຍັງ
    },
    {
      name: "sikodtabong",
      displayName: "ສີໂຄດຕະບອງ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/sikodtabong",
      dataKey: "cadastre_parcel_details_0102",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#ff5733",
      hasLoaded: false,
    },
    {
      name: "xaisettha",
      displayName: "ໄຊເສດຖາ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/xaisettha",
      dataKey: "cadastre_parcel_details_0103",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#33ff57",
      hasLoaded: false,
    },
    {
      name: "sisattanak",
      displayName: "ສີສັດຕະນາກ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/sisattanak",
      dataKey: "cadastre_parcel_details_0104",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#5733ff",
      hasLoaded: false,
    },
    {
      name: "naxaithong",
      displayName: "ນາຊາຍທອງ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/naxaithong",
      dataKey: "cadastre_parcel_details_0105",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#ff33f5",
      hasLoaded: false,
    },
    {
      name: "xaithany",
      displayName: "ໄຊທານີ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/xaithany",
      dataKey: "cadastre_parcel_details_0106",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#33fff5",
      hasLoaded: false,
    },
    {
      name: "hadxaifong",
      displayName: "ຫາດຊາຍຟອງ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/hadxaifong",
      dataKey: "cadastre_parcel_details_0107",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#f5ff33",
      hasLoaded: false,
    },
    {
      name: "xangthong",
      displayName: "ສັງທອງ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/xangthong",
      dataKey: "cadastre_parcel_details_0108",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#ff8c33",
      hasLoaded: false,
    },
    {
      name: "pakngum",
      displayName: "ປາກງື່ມ",
      province: "VientianeCapital",
      endpoint: "https://msmapi.up.railway.app/api/rest/pakngum",
      dataKey: "cadastre_parcel_details_0109",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#8c33ff",
      hasLoaded: false,
    },
  ]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleDistrict = useCallback((districtName) => {
    setDistricts((prevDistricts) => {
      const updatedDistricts = prevDistricts.map((d) =>
        d.name === districtName ? { ...d, checked: !d.checked } : d
      );
      return updatedDistricts;
    });
    // ອັບເດດເມືອງທີ່ຖືກເລືອກສໍາລັບຊັ້ນຂໍ້ມູນສິ່ງປຸກສ້າງ
    setSelectedDistrictForBuildings(districtName);
  }, []);

  const handleProvinceSelectionForMap = useCallback(
    (coords, zoom, provinceName) => {
      if (mapInstanceRef.current && openLayersLoadedState) {
        mapInstanceRef.current.getView().setCenter(coords);
        mapInstanceRef.current.getView().setZoom(zoom);
        setCenterState(coords);
        setZoomState(zoom);
      } else {
        console.warn("Map not loaded or ready to move yet.");
      }
      setSelectedProvinceForDistricts(provinceName);
      setSelectedProvinceForRoads(provinceName);
    },
    [openLayersLoadedState]
  );

  const handleDistrictSelectionForBuildings = useCallback((districtName) => {
    setSelectedDistrictForBuildings(districtName);
  }, []);

  useEffect(() => {
    let map;
    let resizeObserver;

    // ຖ້າ map instance ມີຢູ່ແລ້ວ, ພຽງແຕ່ກໍານົດ target ແລະ update size
    if (mapInstanceRef.current) {
      if (mapRef.current) {
        mapInstanceRef.current.setTarget(mapRef.current);
        mapInstanceRef.current.updateSize();
      }
      return;
    }

    const initOpenLayersMap = () => {
      if (
        !mapRef.current ||
        mapRef.current.clientWidth === 0 ||
        mapRef.current.clientHeight === 0
      ) {
        console.log(
          "Map container dimensions are zero. Retrying map initialization..."
        );
        setTimeout(initOpenLayersMap, 100);
        return;
      }

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
        target: mapRef.current,
        layers: [osmLayer, googleSatLayer, googleHybridLayer],
        view: initialView,
        controls: defaultControls(),
        interactions: defaultInteractions(),
        pixelRatio: 1,
      });

      mapInstanceRef.current = map;
      setOpenLayersLoadedState(true);

      map.updateSize();

      // ຕັ້ງຄ່າ visibility ເບື້ອງຕົ້ນສໍາລັບ base maps
      map.getLayers().forEach((layer) => {
        if (layer.get("name") === selectedBaseMap) {
          layer.setVisible(true);
        } else {
          // ປິດ layer ອື່ນໆ, ແຕ່ບໍ່ປິດ layer ຂໍ້ມູນ ຫຼື layer ການແຕ້ມ
          if (
            !layer.get("name").startsWith("parcel_layer_") &&
            layer.get("name") !== "drawing_layer" &&
            layer.get("name") !== "road_layer" &&
            layer.get("name") !== "building_layer"
          ) {
            layer.setVisible(false);
          }
        }
      });

      map.getView().on("change:center", () => {
        setCenterState(map.getView().getCenter());
      });
      map.getView().on("change:resolution", () => {
        setZoomState(map.getView().getZoom());
      });

      // ໃຊ້ ResizeObserver ເພື່ອ update map size ເມື່ອ container ປ່ຽນຂະໜາດ
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.updateSize();
        }
      });
      if (mapRef.current) {
        resizeObserver.observe(mapRef.current);
      }

      console.log("OpenLayers Map initialized successfully.");
    };

    initOpenLayersMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined); // Unset map target
        mapInstanceRef.current = null; // Clear map instance
      }
      if (mapRef.current && resizeObserver) {
        resizeObserver.unobserve(mapRef.current); // Disconnect observer
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Effect to update map view when centerState or zoomState changes
  useEffect(() => {
    if (mapInstanceRef.current && openLayersLoadedState) {
      const view = mapInstanceRef.current.getView();
      if (view.getCenter() !== centerState || view.getZoom() !== zoomState) {
        view.setCenter(centerState);
        view.setZoom(zoomState);
      }
    }
  }, [centerState, zoomState, openLayersLoadedState]);

  // Effect to update map size when sidebar collapses/expands
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current.updateSize();
      }, 300); // ໃຫ້ເວລາ sidebar ເຮັດ animation

      return () => clearTimeout(timer);
    }
  }, [isSidebarCollapsed]);

  // Effect for drawing interactions
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    let vectorLayer = map
      .getLayers()
      .getArray()
      .find((l) => l.get("name") === "drawing_layer");

    // ສ້າງ layer ການແຕ້ມຖ້າຍັງບໍ່ມີ
    if (!vectorLayer) {
      vectorLayer = new VectorLayer({
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
        properties: { name: "drawing_layer" },
      });
      map.addLayer(vectorLayer);
    }

    // ລຶບ interaction ການແຕ້ມເດີມອອກຖ້າມີ
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    // ເພີ່ມ interaction ການແຕ້ມໃໝ່ຕາມໂໝດທີ່ຖືກເລືອກ
    if (drawingMode) {
      let drawInteraction;
      switch (drawingMode) {
        case "Point":
        case "LineString":
        case "Polygon":
        case "Circle":
          drawInteraction = new Draw({
            source: vectorSourceRef.current,
            type: drawingMode,
          });
          break;
        case "Box":
          drawInteraction = new Draw({
            source: vectorSourceRef.current,
            type: "Circle", // ໃຊ້ Circle type ແຕ່ມີ geometryFunction ເພື່ອສ້າງ Box
            geometryFunction: createBox(),
          });
          break;
        default:
          break;
      }
      if (drawInteraction) {
        map.addInteraction(drawInteraction);
        drawRef.current = drawInteraction;
      }
    }
  }, [drawingMode]);

  const clearDrawing = () => {
    vectorSourceRef.current.clear(); // ລຶບ Features ທັງໝົດຈາກ source ການແຕ້ມ
  };

  // Logic ສໍາລັບການລາກ Drawing Toolbar (Mouse Events)
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    const rect = toolbarRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const mapRect = mapRef.current.getBoundingClientRect();
      let newX = e.clientX - mapRect.left - dragOffset.current.x;
      let newY = e.clientY - mapRect.top - dragOffset.current.y;

      const toolbarWidth = toolbarRef.current.offsetWidth;
      const toolbarHeight = toolbarRef.current.offsetHeight;

      // ປ້ອງກັນບໍ່ໃຫ້ Toolbar ອອກນອກຂອບເຂດແຜນທີ່
      newX = Math.max(0, Math.min(newX, mapRect.width - toolbarWidth));
      newY = Math.max(0, Math.min(newY, mapRect.height - toolbarHeight));

      setToolbarPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Logic ສໍາລັບການລາກ Drawing Toolbar (Touch Events)
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const rect = toolbarRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
      e.preventDefault(); // ປ້ອງກັນການ scroll ຂອງ Browser
    }
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const mapRect = mapRef.current.getBoundingClientRect();
      let newX = e.touches[0].clientX - mapRect.left - dragOffset.current.x;
      let newY = e.touches[0].clientY - mapRect.top - dragOffset.current.y;

      const toolbarWidth = toolbarRef.current.offsetWidth;
      const toolbarHeight = toolbarRef.current.offsetHeight;

      newX = Math.max(0, Math.min(newX, mapRect.width - toolbarWidth));
      newY = Math.max(0, Math.min(newY, mapRect.height - toolbarHeight));

      setToolbarPosition({ x: newX, y: newY });
      e.preventDefault(); // ປ້ອງກັນການ scroll ຂອງ Browser
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    } else {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Effect ເພື່ອອັບເດດສະຖານະການໂຫຼດໂດຍລວມ ແລະ ເປີເຊັນຄວາມສຳເລັດ
  useEffect(() => {
    // ກັ່ນຕອງຫາເມືອງທີ່ຖືກ Check ແລະກຳລັງໂຫຼດຢູ່
    const activelyLoadingDistricts = districts.filter(
      (d) => d.checked && d.loading
    );

    // ກໍານົດວ່າຄວນສະແດງ LoadingBar ບໍ່
    const shouldShowLoadingBar = activelyLoadingDistricts.length > 0;

    // ຄິດໄລ່ເປີເຊັນຄວາມສຳເລັດໂດຍອີງໃສ່ທຸກເມືອງທີ່ຖືກ Check, ວ່າມີຈັກເມືອງທີ່ໂຫຼດສຳເລັດແລ້ວ
    const allCheckedDistricts = districts.filter((d) => d.checked);
    const completedCheckedDistricts = allCheckedDistricts.filter(
      (d) => d.hasLoaded
    ).length;
    const totalCheckedCount = allCheckedDistricts.length;

    let progress = 0;
    if (totalCheckedCount > 0) {
      progress = Math.floor(
        (completedCheckedDistricts / totalCheckedCount) * 100
      );
    }

    // ຄິດໄລ່ຈໍານວນ Features ທັງໝົດທີ່ໂຫຼດສຳເລັດ
    let totalFeaturesLoadedCount = 0;
    allCheckedDistricts.forEach((d) => {
      if (d.hasLoaded && d.parcels) {
        totalFeaturesLoadedCount += d.parcels.length;
      }
    });

    // ຕັ້ງຄ່າສະຖານະການໂຫຼດໂດຍລວມ
    setIsLoadingData(shouldShowLoadingBar);
    setDataLoadProgress(progress);
    setCurrentLoadedFeaturesCount(totalFeaturesLoadedCount);

    // ຖ້າບໍ່ມີເມືອງໃດກຳລັງໂຫຼດຢູ່, ແຕ່ມີບາງເມືອງທີ່ຖືກ Check ໄດ້ໂຫຼດສຳເລັດແລ້ວ
    // ໃຫ້ສະແດງ 100% ສອງສາມວິນາທີ ແລ້ວເຊື່ອງ
    if (!shouldShowLoadingBar && totalCheckedCount > 0 && progress === 100) {
      const timer = setTimeout(() => {
        setIsLoadingData(false);
        setDataLoadProgress(0);
        setCurrentLoadedFeaturesCount(0); // Reset count when hidden
      }, 500); // ສະແດງ 100% 0.5 ວິນາທີ
      return () => clearTimeout(timer);
    } else if (totalCheckedCount === 0 && isLoadingData) {
      // ຖ້າບໍ່ມີເມືອງໃດຖືກ Check ແລ້ວ LoadingBar ຍັງສະແດງຢູ່, ໃຫ້ເຊື່ອງທັນທີ
      setIsLoadingData(false);
      setDataLoadProgress(0);
      setCurrentLoadedFeaturesCount(0); // Reset count when hidden
    }
  }, [districts, isLoadingData, dataLoadProgress]);

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
              {/* Loading Bar - ຈະສະແດງຢູ່ເທິງສຸດຂອງແຜນທີ່ */}
              <LoadingBar
                isLoading={isLoadingData}
                loadingProgress={dataLoadProgress}
                loadedFeaturesCount={currentLoadedFeaturesCount} // ສົ່ງຈໍານວນ Features ທີ່ໂຫຼດແລ້ວ
              />
              <BaseMapSwitcher
                map={mapInstanceRef.current}
                selectedBaseMap={selectedBaseMap}
                onSelectBaseMap={setSelectedBaseMap}
                isSidebarCollapsed={isSidebarCollapsed}
              />
              <DrawingToolbar
                ref={toolbarRef}
                onSelectDrawingMode={setDrawingMode}
                onClearDrawing={clearDrawing}
                currentMode={drawingMode}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                  left: toolbarPosition.x,
                  top: toolbarPosition.y,
                  cursor: isDragging ? "grabbing" : "grab",
                }}
                isDragging={isDragging}
              />
              <ParcelLayerControl
                map={mapInstanceRef.current}
                districts={districts}
                setDistricts={setDistricts}
                onParcelSelect={setSelectedParcel}
              />
              <RoadLayer
                map={mapInstanceRef.current}
                isVisible={isRoadLayerVisible}
                selectedProvince={selectedProvinceForRoads}
              />
              <BuildingLayer
                map={mapInstanceRef.current}
                isVisible={isBuildingLayerVisible}
                selectedDistrict={selectedDistrictForBuildings}
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
            <CoordinateBar map={mapInstanceRef.current} />
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
                      checked={isRoadLayerVisible}
                      onChange={() =>
                        setIsRoadLayerVisible(!isRoadLayerVisible)
                      }
                    />
                    <span>ເສັ້ນທາງ</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={isBuildingLayerVisible}
                      onChange={() =>
                        setIsBuildingLayerVisible(!isBuildingLayerVisible)
                      }
                    />
                    <span>ສິ່ງປຸກສ້າງ</span>
                  </label>
                </div>
              </div>

              <DistrictSelector
                districts={districts}
                onToggle={toggleDistrict}
                isSidebarCollapsed={isSidebarCollapsed}
                isExpanded={isDistrictsExpanded}
                onToggleExpansion={() =>
                  setIsDistrictsExpanded(!isDistrictsExpanded)
                }
                selectedProvinceForDistricts={selectedProvinceForDistricts}
                onDistrictSelectForBuildings={
                  handleDistrictSelectionForBuildings
                }
              />
              <ProvinceControls
                setCenter={setCenterState}
                setZoom={setZoomState}
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
