# Live Bus Location Tracking System

This document describes the live bus location tracking feature implemented in the College Management System.

## 🚌 Features

### For Drivers
- **Start/Stop Location Sharing**: Drivers can start sharing their live location from the driver dashboard
- **Automatic Location Updates**: Location is updated every 10 seconds when sharing is active
- **Permission Handling**: Proper handling of browser location permissions
- **Visual Feedback**: Clear indication when location sharing is active

### For Users (Students, Teachers, HOD, Admin)
- **Live Bus Tracking**: View real-time location of all buses via "Live Map" button in Bus Management
- **Bus Selection**: Select any bus to view its current location and history
- **Location History**: View last 6 location updates (60 seconds of history)
- **Online/Offline Status**: See which buses are currently online
- **Bus Information**: View driver details, route information, and bus specifications
- **Integrated Experience**: Live tracking is now part of the Bus Management panel

## 🛠️ Technical Implementation

### Location Service (`src/services/locationService.ts`)
- **Geolocation API**: Uses browser's native geolocation API
- **10-Second Intervals**: Updates location every 10 seconds
- **Local Storage**: Stores location history locally (6 locations = 60 seconds)
- **WebSocket Ready**: Prepared for real-time server communication
- **Error Handling**: Comprehensive error handling for location access

### Driver Dashboard Integration
- **Location Sharing Button**: Added to Quick Actions section
- **Conditional Display**: Only shows when a bus is assigned
- **Loading States**: Shows loading spinner during permission requests
- **Status Indicators**: Green for active, red for stopping

### Bus Management Integration (`src/components/Transport/BusManagement.tsx`)
- **Live Map Button**: Green button in the header to open live tracking
- **Real-time Updates**: Refreshes every 5 seconds when tracking is active
- **Bus List**: Shows all buses with online/offline status in modal
- **Map Placeholder**: Ready for integration with mapping libraries
- **Location History**: Displays recent location updates
- **Responsive Design**: Works on desktop and mobile
- **Modal Interface**: Live tracking opens in a full-screen modal

## 📱 User Interface

### Driver Dashboard
```
┌─────────────────────────────────────┐
│ Quick Actions                       │
├─────────────────────────────────────┤
│ [🚌 View All Buses]                 │
│ [📅 My Attendance]                  │
│ [📍 Start Location Sharing] ← NEW   │
│ [📞 Emergency Contact]              │
└─────────────────────────────────────┘
```

### Bus Management with Live Map
```
┌─────────────────────────────────────┐
│ Bus Management    [Live Map] [Add]  │
├─────────────────────────────────────┤
│ Bus List & Management Interface     │
│                                     │
│ When "Live Map" is clicked:         │
│ ┌─────────────────────────────────┐ │
│ │ Live Bus Tracking (Modal)       │ │
│ │ Available Buses │ Map & Details │ │
│ │ Bus 001 (Live)  │ Interactive   │ │
│ │ Bus 002 (Off)   │ Map           │ │
│ │ Bus 003 (Live)  │               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🔧 Setup Instructions

### 1. Browser Permissions
- Users need to grant location permissions
- HTTPS is required for geolocation in production
- Works on modern browsers (Chrome, Firefox, Safari, Edge)

### 2. WebSocket Server (Optional)
For real-time updates across multiple devices, set up a WebSocket server:

```bash
# Follow the instructions in websocket-server-setup.md
cd bus-tracking-server
npm install
npm start
```

### 3. Enable WebSocket in Location Service
Uncomment the WebSocket code in `src/services/locationService.ts`:

```typescript
// Uncomment these lines:
this.socket = io('ws://localhost:3001');
this.socket.on('connect', () => {
  console.log('[LocationService] Connected to WebSocket server');
});
```

## 📊 Data Storage

### Local Storage Structure
```javascript
// Key: bus_location_{busId}
// Value: Array of LocationData (max 6 items)
[
  {
    latitude: 19.0760,
    longitude: 72.8777,
    timestamp: 1640995200000,
    driverId: "driver123",
    busId: "bus001",
    accuracy: 10
  }
]
```

### Location Data Format
```typescript
interface LocationData {
  latitude: number;      // GPS latitude
  longitude: number;     // GPS longitude
  timestamp: number;     // Unix timestamp
  driverId: string;      // Driver ID
  busId: string;         // Bus ID
  accuracy?: number;     // GPS accuracy in meters
}
```

## 🔒 Privacy & Security

### Location Privacy
- Location data is stored locally by default
- No location data is sent to external servers without WebSocket setup
- Users can stop location sharing at any time
- Location history is limited to 60 seconds

### Permission Handling
- Explicit permission request before accessing location
- Graceful fallback when permissions are denied
- Clear error messages for different permission states

## 🚀 Future Enhancements

### Planned Features
1. **Interactive Maps**: Integration with Leaflet or Google Maps
2. **Route Visualization**: Show bus routes on the map
3. **ETA Calculation**: Estimated time of arrival
4. **Push Notifications**: Notify users when bus is nearby
5. **Offline Support**: Cache location data for offline viewing

### Integration Options
1. **Google Maps API**: For detailed mapping
2. **OpenStreetMap**: Free alternative mapping
3. **Firebase Realtime Database**: For cloud storage
4. **Supabase**: Alternative real-time database

## 🐛 Troubleshooting

### Common Issues

#### Location Permission Denied
```
Error: Location access denied by user
Solution: Ask user to enable location permissions in browser settings
```

#### Location Not Available
```
Error: Location information unavailable
Solution: Check GPS signal, try moving to open area
```

#### WebSocket Connection Failed
```
Error: WebSocket connection failed
Solution: Ensure WebSocket server is running on correct port
```

### Debug Mode
Enable debug logging by opening browser console:
```javascript
// All location service logs are prefixed with [LocationService]
```

## 📈 Performance Considerations

### Optimization Features
- **10-Second Intervals**: Balances accuracy with battery life
- **Limited History**: Only stores 6 recent locations
- **Efficient Updates**: Only updates when location changes significantly
- **Lazy Loading**: Bus tracking panel loads data on demand

### Battery Usage
- Uses `watchPosition` for continuous tracking
- Configurable accuracy settings
- Automatic cleanup on component unmount

## 🔄 API Reference

### LocationService Methods

```typescript
// Start sharing location
await locationService.startLocationSharing(driverId, busId);

// Stop sharing location
locationService.stopLocationSharing();

// Check if sharing is active
const isSharing = locationService.isLocationSharing();

// Get location history for a bus
const history = locationService.getLocationHistoryForBus(busId);

// Get current location (one-time)
const location = await locationService.getCurrentLocation();
```

## 📝 Usage Examples

### Starting Location Sharing (Driver)
```typescript
const handleStartSharing = async () => {
  const success = await locationService.startLocationSharing(
    user.id, 
    assignedBus.id
  );
  
  if (success) {
    setIsSharing(true);
    alert('Location sharing started!');
  } else {
    alert('Failed to start location sharing');
  }
};
```

### Viewing Bus Locations (User)
```typescript
const updateBusLocations = () => {
  buses.forEach(bus => {
    const history = locationService.getLocationHistoryForBus(bus.id);
    if (history.length > 0) {
      const latestLocation = history[history.length - 1];
      // Update UI with latest location
    }
  });
};
```

This live location tracking system provides a solid foundation for real-time bus monitoring with room for future enhancements and integrations.
