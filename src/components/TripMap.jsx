import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Compass } from 'lucide-react';

// Fix for default Leaflet marker icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Destination Coordinates Fallback Dictionary
const CITY_COORDS = {
  paris: [48.8566, 2.3522],
  london: [51.5074, -0.1278],
  tokyo: [35.6762, 139.6503],
  kyoto: [35.0116, 135.7681],
  bali: [-8.3405, 115.0920],
  dubai: [25.2048, 55.2708],
  delhi: [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  goa: [15.2993, 74.1240],
  manali: [32.2432, 77.1892],
  rome: [41.9028, 12.4964],
  barcelona: [41.3851, 2.1734],
  bangkok: [13.7563, 100.5018],
  singapore: [1.3521, 103.8198],
  newyork: [40.7128, -74.0060],
  switzerland: [46.8182, 8.2275]
};

export default function TripMap({ destination, days = [], activeDay = 'all' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loadingCoords, setLoadingCoords] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      setLoadingCoords(true);

      // 1. Resolve Center Coordinates
      let center = [20.5937, 78.9629]; // Default India
      const key = destination?.toLowerCase().replace(/\s+/g, '') || '';

      // Check local lookup table first
      for (const [city, coords] of Object.entries(CITY_COORDS)) {
        if (key.includes(city)) {
          center = coords;
          break;
        }
      }

      // Try live OpenStreetMap Nominatim geocoding if not found in dictionary
      if (center[0] === 20.5937 && destination) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
          const data = await res.json();
          if (data && data[0]) {
            center = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
        } catch (e) {
          console.warn('Geocoding fallback to default:', e.message);
        }
      }

      if (!isMounted) return;

      // Clean up previous map instance if re-rendering
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: 12,
        scrollWheelZoom: false,
      });

      // 🗺️ 100% Free English Map Tiles (Esri World Street Map - No Watermarks, No API Key)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, TomTom',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Filter days based on tab
      const daysToRender = activeDay === 'all' 
        ? days 
        : days.filter(d => String(d.day) === String(activeDay));

      const markersGroup = L.featureGroup();

      // Custom marker color generator
      const createCustomIcon = (badge, colorHex) => {
        return L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="
              background-color: ${colorHex};
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: bold;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              ${badge}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15],
        });
      };

      // Add markers for morning, afternoon, and evening
      daysToRender.forEach((d, dayIdx) => {
        const slots = [
          { time: 'Morning', icon: '🌅', color: '#f59e0b', data: d.morning, offset: [-0.008, -0.008] },
          { time: 'Afternoon', icon: '☀️', color: '#3b82f6', data: d.afternoon, offset: [0.006, 0.009] },
          { time: 'Evening', icon: '🌙', color: '#8b5cf6', data: d.evening, offset: [0.012, -0.006] }
        ];

        slots.forEach((slot, slotIdx) => {
          if (!slot.data?.activity) return;

          const jitter = (dayIdx * 0.007) + (slotIdx * 0.004);
          const lat = center[0] + slot.offset[0] + (Math.sin(dayIdx + slotIdx) * jitter);
          const lng = center[1] + slot.offset[1] + (Math.cos(dayIdx + slotIdx) * jitter);

          const popupContent = `
            <div style="font-family: sans-serif; min-width: 180px; color: #1e293b;">
              <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">
                ${slot.icon} Day ${d.day} — ${slot.time}
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #2563eb; margin-bottom: 4px;">
                ${slot.data.activity}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                ⏱️ ${slot.data.time || 'Scheduled'} | 💵 ${slot.data.approxCost || 'Included'}
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 8px;">
                ${slot.data.description || ''}
              </div>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(slot.data.activity + ', ' + (destination || ''))}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="
                  display: block;
                  text-align: center;
                  padding: 6px 10px;
                  background-color: #2563eb;
                  color: #ffffff;
                  font-size: 11px;
                  font-weight: 700;
                  border-radius: 6px;
                  text-decoration: none;
                  box-shadow: 0 2px 5px rgba(37,99,235,0.3);
                "
              >
                🗺️ Google Maps Directions &rarr;
              </a>
            </div>
          `;

          const marker = L.marker([lat, lng], {
            icon: createCustomIcon(`D${d.day}`, slot.color)
          }).bindPopup(popupContent);

          marker.addTo(markersGroup);
        });
      });

      markersGroup.addTo(map);

      // Fit map view bounds around all placed markers
      if (markersGroup.getLayers().length > 0) {
        map.fitBounds(markersGroup.getBounds().pad(0.2));
      }

      setLoadingCoords(false);
    }

    initMap();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [destination, days, activeDay]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Map Header */}
      <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">
            Interactive Route Map & Attractions
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Morning</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Afternoon</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Evening</span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full" style={{ height: '380px' }}>
        {loadingCoords && (
          <div className="absolute inset-0 bg-slate-950/70 z-[1000] flex items-center justify-center text-slate-300 text-xs gap-2">
            <Compass className="w-4 h-4 animate-spin text-indigo-400" />
            Loading map for {destination}...
          </div>
        )}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
