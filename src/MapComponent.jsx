import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw, { createBox } from "ol/interaction/Draw"; // ນໍາເຂົ້າ createBox
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
import { PanelLeft, PanelRight } from "lucide-react";

function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource()); // ສໍາລັບການແຕ້ມ
  const drawRef = useRef(null); // ສໍາລັບ interaction ການແຕ້ມ
  const [selectedBaseMap, setSelectedBaseMap] = useState("osm");
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);
  const [centerState, setCenterState] = useState(fromLonLat([102.6, 17.97])); // Vientiane, Laos (ເມືອງຈັນທະບູລີປະມານນີ້)
  const [zoomState, setZoomState] = useState(12); // ເພີ່ມ zoom ເຂົ້າໄປໃກ້ຂຶ້ນ
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // 'Point', 'LineString', 'Polygon', 'Circle', 'Box', null
  const [selectedParcel, setSelectedParcel] = useState(null);

  // ສະຖານະການຫຍໍ້/ຂະຫຍາຍຂອງສ່ວນ "ເມືອງ" ແລະ "ແຂວງ" ພາຍໃນ Sidebar
  const [isDistrictsExpanded, setIsDistrictsExpanded] = useState(true); // ເລີ່ມຕົ້ນໃຫ້ເປີດ
  const [isProvincesExpanded, setIsProvincesExpanded] = useState(true); // ເລີ່ມຕົ້ນໃຫ້ເປີດ

  // ສະຖານະສໍາລັບແຂວງທີ່ຖືກເລືອກເພື່ອສະແດງເມືອງ
  const [selectedProvinceForDistricts, setSelectedProvinceForDistricts] =
    useState(null);

  // For draggable drawing toolbar
  const [toolbarPosition, setToolbarPosition] = useState({ x: 50, y: 50 }); // Initial position
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const toolbarRef = useRef(null);

  // ລາຍຊື່ເມືອງທັງໝົດ 9 ເມືອງ ພ້ອມ endpoint ແລະ dataKey ທີ່ໃຫ້ມາ
  // ໄດ້ເພີ່ມຄຸນສົມບັດ 'province' ເພື່ອເຊື່ອມໂຍງກັບແຂວງ
  const [districts, setDistricts] = useState([
    {
      name: "chanthabury",
      displayName: "ຈັນທະບູລີ",
      province: "ນະຄອນຫຼວງວຽງຈັນ", // Add province name
      endpoint: "https://msmapi.up.railway.app/api/rest/chanthabury",
      dataKey: "cadastre_parcel_details_0101",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#3388ff",
      hasLoaded: false,
    },
    {
      name: "sikodtabong",
      displayName: "ສີໂຄດຕະບອງ",
      province: "ນະຄອນຫຼວງວຽງຈັນ",
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
      province: "ນະຄອນຫຼວງວຽງຈັນ",
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
      province: "ນະຄອນຫຼວງວຽງຈັນ",
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
      province: "ນະຄອນຫຼວງວຽງຈັນ",
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
      province: "ນະຄອນຫຼວງວຽງຈັນ",
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
      province: "ນະຄອນຫຼວງວຽງຈັນ",
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
      province: "ນະຄອນຫຼວງວຽງຈັນ",
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
      province: "ນະຄອນຫຼວງວຽງຈັນ",
      endpoint: "https://msmapi.up.railway.app/api/rest/pakngum",
      dataKey: "cadastre_parcel_details_0109",
      checked: false,
      parcels: [],
      loading: false,
      error: null,
      color: "#8c33ff",
      hasLoaded: false,
    },
    // Add other districts for other provinces here if you have their data and endpoints
    // Example for a hypothetical district in Luang Prabang:
    // {
    //   name: "luangprabang_district1",
    //   displayName: "ເມືອງຫຼວງພະບາງ 1",
    //   province: "ຫຼວງພະບາງ",
    //   endpoint: "https://msmapi.up.railway.app/api/rest/luangprabang_district1",
    //   dataKey: "cadastre_parcel_details_LPB01",
    //   checked: false, parcels: [], loading: false, error: null, color: "#1a73e8", hasLoaded: false,
    // },
  ]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleDistrict = useCallback((districtName) => {
    setDistricts((prevDistricts) =>
      prevDistricts.map((d) =>
        d.name === districtName ? { ...d, checked: !d.checked } : d
      )
    );
  }, []);

  // ຟັງຊັນທີ່ຈະຖືກສົ່ງໄປ ProvinceControls ເພື່ອອັບເດດແຂວງທີ່ຖືກເລືອກ
  const handleProvinceSelection = useCallback((provinceName) => {
    setSelectedProvinceForDistricts(provinceName);
    // Optionally, you might want to collapse the district section when a new province is selected
    // setIsDistrictsExpanded(true); // Keep it open to show districts of new province
  }, []);

  // Main useEffect for map initialization and setup
  useEffect(() => {
    let map;
    let resizeObserver;

    // Use a flag to prevent re-initialization if already done
    if (mapInstanceRef.current) {
      return;
    }

    const initOpenLayersMap = () => {
      if (!mapRef.current) {
        // If ref is not yet available, defer initialization
        setTimeout(initOpenLayersMap, 100); // ລອງອີກຄັ້ງຫຼັງຈາກຊັກຊ້າເລັກນ້ອຍ
        return;
      }

      // Check if container has dimensions before initializing
      const width = mapRef.current.clientWidth;
      const height = mapRef.current.clientHeight;

      if (width === 0 || height === 0) {
        console.log(
          "Map container dimensions are zero. Retrying map initialization..."
        );
        setTimeout(initOpenLayersMap, 100); // ຖ້າຂະໜາດຍັງເປັນສູນ, ລອງອີກຄັ້ງ
        return;
      }

      // ຖ້າ mapInstance ຖືກ initialize ແລ້ວ, ພຽງແຕ່ກວດສອບ target ແລະ updateSize
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(mapRef.current);
        mapInstanceRef.current.updateSize();
        return;
      }

      // Base Layers (ຊັ້ນພື້ນຖານ)
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
        maxZoom: 20,
      });

      map = new Map({
        target: mapRef.current, // ກໍານົດ target ໂດຍກົງເມື່ອສ້າງແຜນທີ່
        layers: [osmLayer, googleSatLayer, googleHybridLayer],
        view: initialView,
        controls: defaultControls(),
        interactions: defaultInteractions(),
        pixelRatio: 1, // ຕັ້ງຄ່າ pixelRatio ເປັນ 1 ເພື່ອປັບປຸງປະສິດທິພາບການຊູມ
      });

      mapInstanceRef.current = map;
      setOpenLayersLoadedState(true);

      // ບັງຄັບໃຫ້ແຜນທີ່ຄິດໄລ່ຂະໜາດຂອງມັນຄືນໃໝ່ທັນທີ
      map.updateSize();

      // Initial base map selection (ການເລືອກແຜນທີ່ພື້ນຖານເບື້ອງຕົ້ນ)
      map.getLayers().forEach((layer) => {
        if (layer.get("name") === selectedBaseMap) {
          layer.setVisible(true);
        } else {
          layer.setVisible(false);
        }
      });

      // Handle map view changes (ຈັດການການປ່ຽນແປງມຸມມອງແຜນທີ່)
      map.getView().on("change:center", () => {
        setCenterState(map.getView().getCenter());
      });
      map.getView().on("change:resolution", () => {
        setZoomState(map.getView().getZoom());
      });

      // Add a resize observer to automatically update map size if its container changes
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.updateSize();
        }
      });
      resizeObserver.observe(mapRef.current);

      console.log("OpenLayers Map initialized successfully.");
    };

    // Start the map initialization process
    initOpenLayersMap();

    return () => {
      // Cleanup function
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
      if (mapRef.current && resizeObserver) {
        resizeObserver.unobserve(mapRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // This effect ensures map updates its size when sidebar collapses/expands
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Small delay to allow DOM layout to settle after sidebar transition
      const timer = setTimeout(() => {
        mapInstanceRef.current.updateSize();
      }, 300); // Adjust delay if needed based on sidebar transition duration

      return () => clearTimeout(timer);
    }
  }, [isSidebarCollapsed]); // Depend on sidebar collapsed state

  // Sync center and zoom state with map (ຊິ້ງສະຖານະ center ແລະ zoom ກັບແຜນທີ່)
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      (mapInstanceRef.current.getView().getCenter() !== centerState ||
        mapInstanceRef.current.getView().getZoom() !== zoomState)
    ) {
      mapInstanceRef.current.getView().setCenter(centerState);
      mapInstanceRef.current.getView().setZoom(zoomState);
    }
  }, [centerState, zoomState]);

  // Drawing Layer and Interactions (ຊັ້ນການແຕ້ມ ແລະ ການໂຕ້ຕອບ)
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

    // Remove previous draw interaction if any (ລຶບ interaction ການແຕ້ມກ່ອນໜ້າຖ້າມີ)
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    if (drawingMode) {
      let drawInteraction;
      switch (drawingMode) {
        case "Point":
        case "LineString":
        case "Polygon":
        case "Circle": // New case for Circle
          drawInteraction = new Draw({
            source: vectorSourceRef.current,
            type: drawingMode,
          });
          break;
        case "Box": // New case for Box (rectangle)
          drawInteraction = new Draw({
            source: vectorSourceRef.current,
            type: "Circle", // 'Box' is implemented as a 'Circle' type with a special geometry function
            geometryFunction: createBox(), // OpenLayers utility to create a box geometry
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
    vectorSourceRef.current.clear();
  };

  // Draggable Toolbar Logic (ເພີ່ມ logic ສໍາລັບ draggable toolbar)
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    // Calculate offset from mouse position to toolbar's top-left corner
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

      // Clamp position within map boundaries
      const toolbarWidth = toolbarRef.current.offsetWidth;
      const toolbarHeight = toolbarRef.current.offsetHeight;

      newX = Math.max(0, Math.min(newX, mapRect.width - toolbarWidth));
      newY = Math.max(0, Math.min(newY, mapRect.height - toolbarHeight));

      setToolbarPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners to window for dragging (ສໍາຄັນສໍາລັບການລາກທີ່ຖືກຕ້ອງ)
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

  // Touch events for mobile dragging
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const rect = toolbarRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
      e.preventDefault(); // Prevent scrolling
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
      e.preventDefault(); // Prevent scrolling
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
          {/* Add inline styles to ensure map-container always has dimensions */}
          <div
            ref={mapRef}
            className="map-container"
            style={{ width: "100%", height: "100%" }}
          ></div>

          {openLayersLoadedState && (
            <>
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

          {/* Render controls only when sidebar is NOT collapsed */}
          {!isSidebarCollapsed && (
            <>
              <DistrictSelector
                districts={districts}
                onToggle={toggleDistrict}
                isSidebarCollapsed={isSidebarCollapsed}
                isExpanded={isDistrictsExpanded}
                onToggleExpansion={() =>
                  setIsDistrictsExpanded(!isDistrictsExpanded)
                }
                selectedProvinceForDistricts={selectedProvinceForDistricts} // Pass selected province
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
                onProvinceSelectForDistricts={handleProvinceSelection} // Pass the new handler
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
