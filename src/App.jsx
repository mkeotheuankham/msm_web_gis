import React, { useEffect, useRef, useState } from "react";

// Component ໃໝ່ສໍາລັບການຄວບຄຸມແຂວງ
function ProvinceControls({ setCenter, setZoom, openLayersLoaded }) {
  // ຂໍ້ມູນຂອງແຂວງຕ່າງໆໃນລາວ ພ້ອມດ້ວຍພິກັດສູນກາງໂດຍປະມານ
  // ຂໍ້ມູນນີ້ສາມາດຖືກດຶງມາຈາກ API ຫຼືໄຟລ໌ JSON ໃນແອັບພລິເຄຊັນທີ່ແທ້ຈິງ
  const provinces = [
    { name: "ນະຄອນຫຼວງວຽງຈັນ", coords: [102.6, 17.96] },
    { name: "ຜົ້ງສາລີ", coords: [102.1, 21.68] },
    { name: "ຫຼວງນໍ້າທາ", coords: [101.4, 21.0] },
    { name: "ບໍ່ແກ້ວ", coords: [100.9, 20.3] },
    { name: "ອຸດົມໄຊ", coords: [102.0, 20.0] },
    { name: "ຫຼວງພະບາງ", coords: [102.13, 19.89] },
    { name: "ຫົວພັນ", coords: [103.9, 20.4] },
    { name: "ໄຊຍະບູລີ", coords: [101.7, 19.2] },
    { name: "ຊຽງຂວາງ", coords: [103.5, 19.4] },
    { name: "ວຽງຈັນ", coords: [102.4, 18.5] }, // ແຂວງວຽງຈັນ
    { name: "ບໍລິຄຳໄຊ", coords: [104.0, 18.2] },
    { name: "ຄຳມ່ວນ", coords: [105.0, 17.5] },
    { name: "ສະຫວັນນະເຂດ", coords: [105.5, 16.5] },
    { name: "ສາລະວັນ", coords: [106.3, 16.0] },
    { name: "ເຊກອງ", coords: [106.8, 15.6] },
    { name: "ຈໍາປາສັກ", coords: [106.0, 14.8] },
    { name: "ອັດຕະປື", coords: [106.8, 14.3] },
    { name: "ໄຊສົມບູນ", coords: [102.9, 18.8] }, // ແຂວງໄຊສົມບູນ
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
      {provinces.map((province) => (
        <button
          key={province.name}
          onClick={() => {
            setCenter(province.coords);
            setZoom(10); // ຕັ້ງຄ່າຊູມເລີ່ມຕົ້ນສຳລັບແຕ່ລະແຂວງ
          }}
          className="flex items-center justify-center p-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105
                     bg-blue-500 text-white font-semibold text-sm
                     hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          disabled={!openLayersLoaded} // ປິດປຸ່ມຖ້າ OpenLayers ຍັງບໍ່ໄດ້ໂຫຼດ
        >
          <i className="lucide lucide-map-pin mr-2 text-base"></i>{" "}
          {province.name}
        </button>
      ))}
    </div>
  );
}

// App component ຫຼັກຂອງແອັບພລິເຄຊັນ Web Mapping
function App() {
  // mapRef ຈະຖືກໃຊ້ເພື່ອອ້າງອີງໃສ່ element HTML ທີ່ແຜນທີ່ OpenLayers ຈະຖືກສະແດງ
  const mapRef = useRef(null);
  // mapInstanceRef ເກັບ instance ຂອງແຜນທີ່ OpenLayers ເພື່ອໃຫ້ສາມາດເຂົ້າເຖິງໄດ້ທົ່ວ component
  const mapInstanceRef = useRef(null);
  // centerState ເກັບຄ່າສູນກາງຂອງແຜນທີ່ໃນຮູບແບບ [longitude, latitude]
  const [centerState, setCenterState] = useState([102.3, 17.97]); // ເຊັນເຕີເລີ່ມຕົ້ນຂອງແຜນທີ່ຄືນະຄອນຫຼວງວຽງຈັນ, ລາວ
  // zoomState ເກັບລະດັບການຊູມຂອງແຜນທີ່
  const [zoomState, setZoomState] = useState(10); // ລະດັບການຊູມເລີ່ມຕົ້ນ
  // openLayersLoadedState ຕິດຕາມວ່າ OpenLayers JS ໄດ້ຖືກໂຫຼດສຳເລັດແລ້ວຫຼືບໍ່
  const [openLayersLoadedState, setOpenLayersLoadedState] = useState(false);

  // useEffect ນີ້ຈະໂຫຼດ OpenLayers CSS ແລະ JavaScript dynamically
  useEffect(() => {
    // ໂຫຼດ OpenLayers CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/ol@latest/ol.css";
    document.head.appendChild(link);

    // ໂຫຼດ OpenLayers JavaScript
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/ol@latest/dist/ol.js";
    script.async = true; // ໂຫຼດແບບ asynchronous
    script.onload = () => {
      // ເມື່ອ script ໂຫຼດສຳເລັດ, ຕັ້ງຄ່າ state ວ່າ OpenLayers ພ້ອມແລ້ວ
      setOpenLayersLoadedState(true);
      console.log("OpenLayers JS loaded successfully.");
    };
    script.onerror = () => {
      console.error("Failed to load OpenLayers JS.");
    };
    document.body.appendChild(script);

    // ຟັງຊັນ cleanup ເພື່ອເອົາ scripts/links ອອກເມື່ອ component ຖືກ unmount
    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []); // ແລ່ນພຽງເທື່ອດຽວເມື່ອ component ຖືກ mounted

  // useEffect hook ນີ້ຈະແລ່ນເມື່ອ component ຖືກ mounted ແລະ OpenLayers ຖືກໂຫຼດແລ້ວ
  useEffect(() => {
    // ກວດສອບໃຫ້ແນ່ໃຈວ່າ mapRef.current ມີຢູ່ ແລະ OpenLayers ຖືກໂຫຼດແລ້ວ
    if (mapRef.current && openLayersLoadedState && typeof ol !== "undefined") {
      console.log("Initializing OpenLayers map.");
      // ສ້າງ instance ໃໝ່ຂອງແຜນທີ່ OpenLayers ໂດຍໃຊ້ວັດຖຸ 'ol' ທົ່ວໂລກ
      const map = new ol.Map({
        // target ກໍານົດ element HTML ທີ່ແຜນທີ່ຈະຖືກສະແດງ
        target: mapRef.current,
        // layers ແມ່ນ array ຂອງ layers ທີ່ຈະສະແດງໃນແຜນທີ່
        layers: [
          new ol.layer.Tile({
            // source ກໍານົດແຫຼ່ງຂໍ້ມູນສໍາລັບ layer, ໃນທີ່ນີ້ໃຊ້ OpenStreetMap (OSM)
            source: new ol.source.OSM(),
          }),
        ],
        // view ກໍານົດຄຸນສົມບັດຂອງ view ຂອງແຜນທີ່ ເຊັ່ນ: ສູນກາງ, ການຊູມ
        view: new ol.View({
          // center ກໍານົດຈຸດສູນກາງຂອງແຜນທີ່. ol.proj.fromLonLat ໃຊ້ເພື່ອປ່ຽນ longitude/latitude
          // ໄປເປັນ projection ທີ່ OpenLayers ໃຊ້ (ໂດຍປົກກະຕິແມ່ນ Web Mercator)
          center: ol.proj.fromLonLat(centerState),
          // zoom ກໍານົດລະດັບການຊູມເລີ່ມຕົ້ນ
          zoom: zoomState,
        }),
      });

      // ເກັບ instance ຂອງແຜນທີ່ໄວ້ໃນ mapInstanceRef ເພື່ອໃຫ້ສາມາດເຂົ້າເຖິງໄດ້ນອກ useEffect
      mapInstanceRef.current = map;

      // ເພີ່ມ listener ເພື່ອຕິດຕາມການປ່ຽນແປງຂອງ view (ການເຄື່ອນຍ້າຍ, ການຊູມ)
      map.on("moveend", () => {
        const view = map.getView();
        // ປ່ຽນກັບຄືນເປັນ LonLat ສໍາລັບການສະແດງ
        const newCenter = ol.proj.toLonLat(view.getCenter());
        const newZoom = view.getZoom();
        // ອັບເດດ state ດ້ວຍຄ່າສູນກາງ ແລະ ການຊູມໃໝ່
        setCenterState([
          parseFloat(newCenter[0].toFixed(2)),
          parseFloat(newCenter[1].toFixed(2)),
        ]);
        setZoomState(parseFloat(newZoom.toFixed(2)));
      });

      // ຟັງຊັນ cleanup ນີ້ຈະແລ່ນເມື່ອ component ຖືກ unmount (ຄືກັບ componentWillUnmount)
      return () => {
        if (mapInstanceRef.current) {
          // ຖອດແຜນທີ່ອອກຈາກ target ເພື່ອປ້ອງກັນ memory leaks
          mapInstanceRef.current.setTarget(undefined);
          mapInstanceRef.current = null;
        }
      };
    } else if (mapRef.current && !openLayersLoadedState) {
      console.log(
        "Map ref is ready, but OpenLayers is not yet loaded. Waiting..."
      );
    }
  }, [openLayersLoadedState]); // ແລ່ນເມື່ອ openLayersLoadedState ປ່ຽນແປງ

  // useEffect ນີ້ຈະແລ່ນເມື່ອ centerState ຫຼື zoomState ປ່ຽນແປງ
  useEffect(() => {
    if (mapInstanceRef.current && openLayersLoadedState) {
      const view = mapInstanceRef.current.getView();
      // ຕັ້ງຄ່າສູນກາງຂອງ view ຖ້າມັນແຕກຕ່າງຈາກ centerState ປັດຈຸບັນ
      if (
        ol.proj
          .toLonLat(view.getCenter())
          .map((coord) => parseFloat(coord.toFixed(2)))
          .toString() !==
        centerState.map((coord) => parseFloat(coord.toFixed(2))).toString()
      ) {
        view.setCenter(ol.proj.fromLonLat(centerState));
      }
      // ຕັ້ງຄ່າການຊູມຂອງ view ຖ້າມັນແຕກຕ່າງຈາກ zoomState ປັດຈຸບັນ
      if (view.getZoom().toFixed(2) !== zoomState.toFixed(2)) {
        view.setZoom(zoomState);
      }
    }
  }, [centerState, zoomState, openLayersLoadedState]); // ແລ່ນເມື່ອ centerState, zoomState, ຫຼື openLayersLoadedState ປ່ຽນແປງ

  return (
    <div className="flex flex-col h-screen font-inter bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg rounded-b-lg">
        <h1 className="text-3xl font-bold text-center">
          ແອັບພລິເຄຊັນ Web Mapping ຂອງຂ້ອຍ
        </h1>
        <p className="text-center text-sm mt-1 opacity-90">
          ສ້າງດ້ວຍ Vite, React, ແລະ OpenLayers
        </p>
      </header>

      {/* Main content area */}
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4">
        {/* Map Container */}
        <div className="flex-grow bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center relative">
          {!openLayersLoadedState && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 z-10 rounded-xl">
              <p className="text-gray-700 text-lg font-semibold">
                ກຳລັງໂຫຼດແຜນທີ່...
              </p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full rounded-xl"></div>
          {/* ສະແດງ Coordinates ປັດຈຸບັນ */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-md text-gray-800 text-sm">
            <p>
              ສູນກາງ: Lon {centerState[0]}, Lat {centerState[1]}
            </p>
            <p>ຊູມ: {zoomState}</p>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full md:w-1/4 bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-2">
            ການຄວບຄຸມແຜນທີ່
          </h2>
          {/* ນຳໃຊ້ ProvinceControls component ທີ່ນີ້ */}
          <ProvinceControls
            setCenter={setCenterState}
            setZoom={setZoomState}
            openLayersLoaded={openLayersLoadedState}
          />

          {/* ສາມາດເພີ່ມການຄວບຄຸມອື່ນໆທີ່ນີ້ໄດ້ */}
          <div className="mt-auto pt-4 border-t text-gray-600 text-sm text-center">
            <p>&copy; 2025 Web Mapping App</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
