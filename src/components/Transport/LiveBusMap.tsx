import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BusLocation } from '../../services/locationService';
import { Bus } from '../../types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus icon
const createBusIcon = (isOnline: boolean) => {
  return L.divIcon({
    className: 'custom-bus-icon',
    html: `
      <div style="
        background-color: ${isOnline ? '#10B981' : '#6B7280'};
        border: 2px solid white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        🚌
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

interface LiveBusMapProps {
  busLocations: Map<string, BusLocation>;
  selectedBus: Bus | null;
  onBusSelect: (bus: Bus) => void;
  buses: Bus[];
}

// Component to handle map updates when selected bus changes
const MapUpdater: React.FC<{ selectedBus: Bus | null; busLocations: Map<string, BusLocation> }> = ({ 
  selectedBus, 
  busLocations 
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBus) {
      const busLocation = busLocations.get(selectedBus.id);
      if (busLocation) {
        const { latitude, longitude } = busLocation.location;
        map.setView([latitude, longitude], 15);
      }
    }
  }, [selectedBus, busLocations, map]);

  return null;
};

const LiveBusMap: React.FC<LiveBusMapProps> = ({ 
  busLocations, 
  selectedBus, 
  onBusSelect,
  buses
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.0760, 72.8777]); // Default to Mumbai
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef<L.Map>(null);

  // Update map center when bus locations change
  useEffect(() => {
    if (busLocations.size > 0) {
      const locations = Array.from(busLocations.values());
      if (locations.length > 0) {
        const firstLocation = locations[0].location;
        setMapCenter([firstLocation.latitude, firstLocation.longitude]);
      }
    }
  }, [busLocations]);

  // Calculate bounds to fit all bus locations
  const getMapBounds = () => {
    if (busLocations.size === 0) return null;
    
    const locations = Array.from(busLocations.values());
    const lats = locations.map(loc => loc.location.latitude);
    const lngs = locations.map(loc => loc.location.longitude);
    
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
    
    return bounds;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  const getLocationAccuracy = (accuracy?: number): string => {
    if (!accuracy) return 'Unknown';
    if (accuracy < 10) return 'Excellent';
    if (accuracy < 50) return 'Good';
    if (accuracy < 100) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        bounds={getMapBounds()}
        boundsOptions={{ padding: [20, 20] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render bus markers */}
        {Array.from(busLocations.entries()).map(([busId, busLocation]) => {
          const { latitude, longitude } = busLocation.location;
          
          return (
            <Marker
              key={busId}
              position={[latitude, longitude]}
              icon={createBusIcon(busLocation.isOnline)}
              eventHandlers={{
                click: () => {
                  // Find the bus object and call onBusSelect
                  const bus = buses.find(b => b.id === busId);
                  if (bus) {
                    onBusSelect(bus);
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{busLocation.busNumber}</h3>
                    <div className={`w-3 h-3 rounded-full ${
                      busLocation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Driver:</span> {busLocation.driverName}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                        busLocation.isOnline 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {busLocation.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </p>
                    <p><span className="font-medium">Last Update:</span> {formatTimeAgo(busLocation.lastUpdate)}</p>
                    <p><span className="font-medium">Accuracy:</span> {getLocationAccuracy(busLocation.location.accuracy)}</p>
                    <p className="text-xs text-gray-500">
                      Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                    </p>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600">
                    <p>Click on bus in list to center map</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Update map when selected bus changes */}
        <MapUpdater selectedBus={selectedBus} busLocations={busLocations} />
      </MapContainer>
    </div>
  );
};

export default LiveBusMap;
