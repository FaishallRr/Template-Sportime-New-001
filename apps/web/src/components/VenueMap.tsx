"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

interface VenueMarker {
  id: string;
  slug?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  price?: string;
  distance_km?: number;
}

interface RouteInfo {
  coordinates: [number, number][];
  distance: string;
  duration: string;
  destination: { name: string; lat: number; lng: number };
}

interface VenueMapProps {
  venues: VenueMarker[];
  onMarkerClick?: (venueId: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  externalUserLocation?: [number, number] | null;
}

const PRESET_LOCATIONS = [
  { name: "Simpang Lima", lat: -6.9893, lng: 110.4236 },
  { name: "Tugu Muda", lat: -6.9843, lng: 110.4093 },
  { name: "Kota Lama", lat: -6.9680, lng: 110.4279 },
  { name: "Undip Tembalang", lat: -7.0490, lng: 110.4380 },
  { name: "BSB Mijen", lat: -7.0200, lng: 110.3300 },
];

export default function VenueMap({
  venues,
  onMarkerClick,
  center = [-6.9932, 110.4203],
  zoom = 13,
  className = "",
  externalUserLocation,
}: VenueMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const drawRouteRef = useRef<(lat: number, lng: number, name: string) => void>(() => {});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const drawUserMarker = (lat: number, lng: number, map: L.Map, showPopup = false) => {
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#4285f4;border:3px solid white;box-shadow:0 0 0 8px rgba(66,133,244,0.2),0 2px 8px rgba(0,0,0,0.3)"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const marker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    (marker as unknown as { _isUserMarker: boolean })._isUserMarker = true;
    if (showPopup) marker.bindPopup("📍 Lokasi Anda").openPopup();
    userMarkerRef.current = marker;
  };

  const clearRoute = () => {
    if (routeLayerRef.current) {
      const map = mapInstanceRef.current;
      if (map) map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
  };

  const setManualLocation = (loc: { lat: number; lng: number; name: string }) => {
    setUserLocation([loc.lat, loc.lng]);
    setShowLocationModal(false);
    toast.success(`Lokasi: ${loc.name}`);

    const map = mapInstanceRef.current;
    if (map) {
      map.setView([loc.lat, loc.lng], 14);
      drawUserMarker(loc.lat, loc.lng, map, true);
    }

    if (pendingRoute) {
      if (map) {
        fetchRoute(loc.lat, loc.lng, pendingRoute.lat, pendingRoute.lng, pendingRoute.name, map);
      }
      setPendingRoute(null);
    }
  };

  const drawRoute = (destLat: number, destLng: number, destName: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      fetchRoute(userLocation[0], userLocation[1], destLat, destLng, destName, map);
      return;
    }

    if (!navigator.geolocation) {
      setPendingRoute({ lat: destLat, lng: destLng, name: destName });
      setShowLocationModal(true);
      return;
    }

    const loadingToast = toast.loading("Mencari rute...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude: startLat, longitude: startLng } = position.coords;
        setUserLocation([startLat, startLng]);
        fetchRoute(startLat, startLng, destLat, destLng, destName, map);
      },
      () => {
        toast.dismiss(loadingToast);
        setPendingRoute({ lat: destLat, lng: destLng, name: destName });
        setShowLocationModal(true);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const fetchRoute = async (
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number,
    destName: string,
    map: L.Map
  ) => {
    const loadingToast = toast.loading("Mencari rute...");
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      toast.dismiss(loadingToast);

      if (!data.routes?.length) {
        toast.error("Rute tidak ditemukan");
        return;
      }

      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );

      clearRoute();

      const layerGroup = L.layerGroup();

      L.polyline(coords, {
        color: "#4285f4",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      const startIcon = L.divIcon({
        className: "route-start-marker",
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#4285f4;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);animation:marker-pop 0.3s forwards"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([startLat, startLng], { icon: startIcon }).addTo(layerGroup);

      const endIcon = L.divIcon({
        className: "route-end-marker",
        html: '<div style="width:22px;height:22px;border-radius:50%;background:#e53935;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;animation:marker-pop 0.3s 0.1s forwards;opacity:0">✓</div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([destLat, destLng], { icon: endIcon }).addTo(layerGroup);

      layerGroup.addTo(map);
      routeLayerRef.current = layerGroup;

      const bounds = L.latLngBounds(coords);
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15 });

      const km = (route.distance / 1000).toFixed(1);
      const min = Math.round(route.duration / 60);
      setRouteInfo({
        coordinates: coords,
        distance: `${km} km`,
        duration: `${min} menit`,
        destination: { name: destName, lat: destLat, lng: destLng },
      });
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Gagal memuat rute. Coba lagi.");
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when venues change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    clearRoute();

    const markersToRemove: L.Marker[] = [];
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && !(layer as unknown as { _isUserMarker?: boolean })._isUserMarker) {
        markersToRemove.push(layer);
      }
    });
    markersToRemove.forEach((m) => map.removeLayer(m));

    const venueIcon = L.divIcon({
      className: "venue-map-marker",
      html: `
        <div style="
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #1b5e20, #43a047);
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 18px;
          animation: marker-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        ">
          <span class="material-symbols-outlined" style="font-size: 20px;">sports_tennis</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -25],
    });

    venues.forEach((venue) => {
      const distanceText = venue.distance_km
        ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">📍 ${venue.distance_km} km dari Anda</div>`
        : "";

      const safeName = venue.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

      const popup = L.popup({
        className: "venue-popup",
        maxWidth: 300,
        closeButton: true,
      }).setContent(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 6px;">
          <h3 style="font-size: 16px; font-weight: 800; margin: 0 0 6px 0; color: #1a1a1a; line-height: 1.3;">${venue.name}</h3>
          <p style="font-size: 13px; color: #555; margin: 0 0 8px 0; line-height: 1.4;">${venue.address}</p>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="background: #f0fdf4; color: #166534; padding: 3px 10px; border-radius: 14px; font-size: 13px; font-weight: 700; letter-spacing: 0.3px;">
              ⭐ ${venue.rating}
            </span>
            ${venue.price ? `<span style="font-size: 13px; font-weight: 700; color: #1b5e20;">${venue.price}</span>` : ""}
          </div>
          ${distanceText}
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button onclick="window.__onVenueClick && window.__onVenueClick('${venue.id}')" 
              style="
                flex: 1; padding: 12px 16px;
                background: linear-gradient(135deg, #1b5e20, #2e7d32);
                color: white; border: none; border-radius: 12px;
                font-weight: 700; font-size: 14px; cursor: pointer; min-height: 44px;
                letter-spacing: 0.3px;
              ">
              Lihat Detail →
            </button>
            <button onclick="window.__onRouteClick && window.__onRouteClick(${venue.latitude}, ${venue.longitude}, '${safeName}')" 
              style="
                flex-shrink: 0; padding: 12px 14px;
                background: #4285f4; color: white; border: none; border-radius: 12px;
                font-weight: 700; font-size: 14px; cursor: pointer; min-height: 44px;
                letter-spacing: 0.3px;
              ">
              🗺️ Rute
            </button>
          </div>
        </div>
      `);

      L.marker([venue.latitude, venue.longitude], { icon: venueIcon })
        .addTo(map)
        .bindPopup(popup);
    });

    if (venues.length > 0) {
      const bounds = L.latLngBounds(
        venues.map((v) => [v.latitude, v.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues]);

  // Keep drawRouteRef in sync with latest drawRoute
  useEffect(() => {
    drawRouteRef.current = drawRoute;
  });

  // Set up popup callbacks
  useEffect(() => {
    if (onMarkerClick) {
      (window as unknown as { __onVenueClick: (id: string) => void }).__onVenueClick = onMarkerClick;
    }
    (window as unknown as { __onRouteClick: (lat: number, lng: number, name: string) => void }).__onRouteClick = (lat, lng, name) => {
      drawRouteRef.current(lat, lng, name);
    };
    return () => {
      delete (window as unknown as { __onVenueClick?: (id: string) => void }).__onVenueClick;
      delete (window as unknown as { __onRouteClick?: (lat: number, lng: number, name: string) => void }).__onRouteClick;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMarkerClick]);

  // Sync externalUserLocation from parent
  useEffect(() => {
    if (externalUserLocation) {
      setUserLocation(externalUserLocation);
      const map = mapInstanceRef.current;
      if (map) {
        map.setView(externalUserLocation, 12);
        drawUserMarker(externalUserLocation[0], externalUserLocation[1], map);
      }
    }
  }, [externalUserLocation]);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setShowLocationModal(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);

        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 14);
          drawUserMarker(latitude, longitude, map, true);
        }
      },
      () => {
        setShowLocationModal(true);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-xl z-0" />

      {/* Route Info Panel */}
      {routeInfo && (
        <div
          className="route-panel-enter absolute top-4 left-4 right-4 md:left-4 md:right-auto z-[1000] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-4 max-w-sm"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-outline font-medium uppercase tracking-wider mb-0.5">
                Rute ke {routeInfo.destination.name}
              </p>
              <div className="flex items-center gap-4 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-lg">directions_car</span>
                  <span className="font-bold text-on-surface">{routeInfo.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-outline text-lg">straight</span>
                  <span className="font-bold text-on-surface">{routeInfo.distance}</span>
                </div>
              </div>
            </div>
            <button
              onClick={clearRoute}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              title="Hapus rute"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-[1000]">
        <button
          onClick={handleMyLocation}
          className="w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-all hover:scale-110 active:scale-95 cursor-pointer"
          title="Lokasi Saya"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* Manual Location Modal */}
      {showLocationModal && (
        <div
          className="absolute inset-0 z-[2000] flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-surface rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-outline-variant/20"
            style={{
              animation: "location-modal-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
            }}
          >
            <h3 className="text-lg font-bold text-on-surface mb-1">Pilih Lokasi</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Geolokasi tidak tersedia. Pilih lokasi Anda di Semarang:
            </p>
            <div className="space-y-2">
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => setManualLocation(loc)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container transition-all font-medium flex items-center gap-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-outline text-lg">location_on</span>
                  {loc.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowLocationModal(false); setPendingRoute(null); }}
              className="w-full mt-3 py-2.5 text-sm font-bold text-outline hover:text-on-surface transition-colors cursor-pointer rounded-xl"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* User Location Indicator */}
      {userLocation && !routeInfo && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-xl rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium">
          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          Lokasi Anda aktif
        </div>
      )}

      <style>{`
        @keyframes location-modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .route-panel-enter {
          animation: route-panel-in 0.3s ease-out forwards;
        }
        @keyframes route-panel-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
