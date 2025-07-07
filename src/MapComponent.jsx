// MapComponent.jsx
import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import { defaults as defaultControls } from "ol/control";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Draw, { createBox } from "ol/interaction/Draw";
import Snap from "ol/interaction/Snap";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";

// Import UI Components
import BaseMapSwitcher from "./components/map/BaseMapSwitcher";
import CoordinateBar from "./components/ui/CoordinateBar";

/**
 * ຄອມໂປເນັ້ນຫຼັກຂອງແຜນທີ່
 * Main map component that handles OpenLayers map initialization and interactions
 */
function MapComponent({
  selectedBaseMap,
  setSelectedBaseMap,
  interactionMode,
  isSnapActive,
  onMapLoaded,
  children,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const drawingSourceRef = useRef(new VectorSource());

  // Refs to hold interactions - ຕົວອ້າງອີງເກັບການໂຕ້ຕອບ
  const interactionRef = useRef(null);
  const snapInteractionRef = useRef(null);

  // Effect to create the map instance ONE TIME - ສ້າງຕົວຢ່າງແຜນທີ່ຄັ້ງດຽວ
  useEffect(() => {
    const drawingLayer = new VectorLayer({
      source: drawingSourceRef.current,
      zIndex: 10,
    });

    const mapObject = new Map({
      target: mapRef.current,
      layers: [drawingLayer], // Add drawing layer on init
      view: new View({
        center: fromLonLat([103.85, 18.2]), // ຈຸດກາງແຜນທີ່ (ວຽງຈັນ)
        zoom: 7, // ລະດັບການຂະຫຍາຍ
      }),
      controls: defaultControls(),
    });

    setMap(mapObject);

    if (onMapLoaded) {
      onMapLoaded.setOpenLayersLoaded?.(true);
      onMapLoaded.setViewInstance?.(mapObject.getView());
    }

    return () => {
      if (mapObject) {
        mapObject.setTarget(undefined); // ທຳຄວາມສະອາດເມື່ອ component unmount
      }
    };
  }, [onMapLoaded]);

  // Effect to handle base map switching - ຈັດການການປ່ຽນແຜນທີ່ພື້ນຖານ
  useEffect(() => {
    if (!map) return;
    // BaseMapSwitcher component now handles this logic
  }, [map, selectedBaseMap]);

  // Effect to handle drawing & editing interactions - ຈັດການການແຕ້ມແລະແກ້ໄຂ
  useEffect(() => {
    if (!map || typeof interactionMode !== "string") return;

    // Clean up previous interactions - ລຶບການໂຕ້ຕອບກ່ອນໜ້າ
    if (interactionRef.current) {
      map.removeInteraction(interactionRef.current);
      interactionRef.current = null;
    }
    // A bit of a hack to remove the Select interaction for Modify
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Select) {
        map.removeInteraction(interaction);
      }
    });

    if (interactionMode === "None") return;

    let newInteraction;

    if (interactionMode.startsWith("Draw")) {
      const type = interactionMode.replace("Draw", "");
      newInteraction = new Draw({
        source: drawingSourceRef.current,
        type: type === "Box" ? "Circle" : type,
        geometryFunction: type === "Box" ? createBox() : undefined,
      });
    } else if (interactionMode === "Edit") {
      // For editing, we need both Select and Modify
      const selectInteraction = new Select({
        layers: (l) => l.getSource() === drawingSourceRef.current,
      });
      map.addInteraction(selectInteraction);

      newInteraction = new Modify({
        features: selectInteraction.getFeatures(),
      });
    }

    if (newInteraction) {
      map.addInteraction(newInteraction);
      interactionRef.current = newInteraction;
    }
  }, [map, interactionMode]);

  // Effect to handle snapping - ຈັດການການ snap
  useEffect(() => {
    if (!map) return;

    if (snapInteractionRef.current) {
      map.removeInteraction(snapInteractionRef.current);
      snapInteractionRef.current = null;
    }

    if (isSnapActive) {
      const newSnap = new Snap({ source: drawingSourceRef.current });
      map.addInteraction(newSnap);
      snapInteractionRef.current = newSnap;
    }
  }, [map, isSnapActive]);

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container" />

      {map && (
        <>
          <BaseMapSwitcher
            map={map}
            selectedBaseMap={selectedBaseMap}
            onSelectBaseMap={setSelectedBaseMap}
          />
          <CoordinateBar map={map} />

          {/* Pass the map object to all children (like ParcelLayerControl) */}
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { map })
              : child
          )}
        </>
      )}
    </div>
  );
}

export default MapComponent;
