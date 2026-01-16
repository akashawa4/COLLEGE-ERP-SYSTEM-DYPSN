import { io, Socket } from 'socket.io-client';
import { busService } from '../firebase/firestore';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  driverId: string;
  busId: string;
  accuracy?: number;
}

export interface BusLocation {
  busId: string;
  busNumber: string;
  driverName: string;
  location: LocationData;
  isOnline: boolean;
  lastUpdate: number;
}

class LocationService {
  private socket: Socket | null = null;
  private watchId: number | null = null;
  private fallbackWatchId: number | null = null;
  private isSharing = false;
  private hasReceivedLocation = false;
  private locationHistory: LocationData[] = [];
  private readonly MAX_HISTORY = 6; // 10 seconds * 6 = 60 seconds of history
  private readonly UPDATE_INTERVAL = 10000; // 10 seconds
  private lastUpdateTime = 0;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    // Connect to WebSocket server (you'll need to set up a WebSocket server)
    console.log('[LocationService] Initializing WebSocket connection...');
    
    // Uncomment the following lines when you have a WebSocket server running
    // this.socket = io('ws://localhost:3001');
    
    // this.socket.on('connect', () => {
    //   console.log('[LocationService] Connected to WebSocket server');
    // });

    // this.socket.on('disconnect', () => {
    //   console.log('[LocationService] Disconnected from WebSocket server');
    // });

    // this.socket.on('busLocationUpdate', (data: BusLocation) => {
    //   this.handleWebSocketLocationUpdate(data);
    // });
  }

  public async startLocationSharing(driverId: string, busId: string): Promise<boolean> {
    if (this.isSharing) {
      console.log('[LocationService] Already sharing location');
      return true;
    }

    if (!navigator.geolocation) {
      console.error('[LocationService] Geolocation is not supported by this browser');
      return false;
    }

    try {
      // Request location permission
      const permission = await this.requestLocationPermission();
      if (!permission) {
        console.error('[LocationService] Location permission denied');
        return false;
      }

      this.isSharing = true;
      console.log('[LocationService] Starting location sharing...');
      
      // Update bus status to active
      await this.updateBusStatus(busId, 'active');

      // Start watching position with high accuracy first
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handleLocationUpdateFromGeolocation(position, driverId, busId);
        },
        (error) => {
          console.error('[LocationService] Error getting location:', error);
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // Increased to 30 seconds
          maximumAge: 10000 // Increased to 10 seconds
        }
      );

      // Set up a fallback with lower accuracy if high accuracy fails
      setTimeout(() => {
        if (this.isSharing && !this.hasReceivedLocation) {
          console.log('[LocationService] Setting up fallback location tracking...');
          this.setupFallbackLocationTracking(driverId, busId);
        }
      }, 35000); // After 35 seconds, set up fallback

      return true;
    } catch (error) {
      console.error('[LocationService] Error starting location sharing:', error);
      this.isSharing = false;
      return false;
    }
  }

  public async stopLocationSharing(): Promise<void> {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    if (this.fallbackWatchId !== null) {
      navigator.geolocation.clearWatch(this.fallbackWatchId);
      this.fallbackWatchId = null;
    }
    
    this.isSharing = false;
    this.hasReceivedLocation = false;
    this.locationHistory = [];
    
    // Update bus status to inactive
    // We need to get the current bus ID from the location history
    if (this.locationHistory.length > 0) {
      const lastLocation = this.locationHistory[this.locationHistory.length - 1];
      await this.updateBusStatus(lastLocation.busId, 'inactive');
    }
    
    console.log('[LocationService] Stopped location sharing');
  }

  private async requestLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
          resolve(result.state === 'granted');
        });
      } else {
        // Fallback: try to get current position
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      }
    });
  }

  private handleLocationUpdateFromGeolocation(position: GeolocationPosition, driverId: string, busId: string): void {
    const now = Date.now();
    
    // Mark that we've received a location
    this.hasReceivedLocation = true;
    
    // Only update every 10 seconds
    if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      return;
    }

    this.lastUpdateTime = now;

    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: now,
      driverId,
      busId,
      accuracy: position.coords.accuracy
    };

    // Add to history
    this.locationHistory.push(locationData);
    
    // Keep only last 6 locations (60 seconds)
    if (this.locationHistory.length > this.MAX_HISTORY) {
      this.locationHistory.shift();
    }

    // Send to server via Firebase
    this.sendLocationToServer(locationData);

    console.log('[LocationService] Location updated:', locationData);
  }

  private async sendLocationToServer(locationData: LocationData): Promise<void> {
    console.log('[LocationService] Sending location to server:', locationData);
    
    try {
      // Upload to Firebase
      await busService.updateBusLocation(locationData.busId, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: locationData.timestamp,
        accuracy: locationData.accuracy
      });
      
      console.log('[LocationService] Location uploaded to Firebase successfully');
    } catch (error) {
      console.error('[LocationService] Error uploading to Firebase:', error);
      
      // Fallback to localStorage if Firebase fails
      this.storeLocationInLocalStorage(locationData);
    }
    
    // Uncomment the following lines when you have a WebSocket server running
    // if (this.socket && this.socket.connected) {
    //   this.socket.emit('locationUpdate', locationData);
    // }
  }

  private storeLocationInLocalStorage(locationData: LocationData): void {
    try {
      const key = `bus_location_${locationData.busId}`;
      const existingData = localStorage.getItem(key);
      let locations: LocationData[] = [];
      
      if (existingData) {
        locations = JSON.parse(existingData);
      }
      
      locations.push(locationData);
      
      // Keep only last 6 locations
      if (locations.length > this.MAX_HISTORY) {
        locations = locations.slice(-this.MAX_HISTORY);
      }
      
      localStorage.setItem(key, JSON.stringify(locations));
    } catch (error) {
      console.error('[LocationService] Error storing location:', error);
    }
  }

  private handleLocationError(error: GeolocationPositionError): void {
    let message = 'Unknown location error';
    let shouldRetry = false;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied by user. Please enable location permissions in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable. Please check your GPS signal and try again.';
        shouldRetry = true;
        break;
      case error.TIMEOUT:
        message = 'Location request timed out. This may be due to poor GPS signal. Retrying...';
        shouldRetry = true;
        break;
    }
    
    console.error('[LocationService] Location error:', message);
    
    // Retry for timeout and unavailable errors
    if (shouldRetry && this.isSharing) {
      console.log('[LocationService] Retrying location request in 5 seconds...');
      setTimeout(() => {
        if (this.isSharing) {
          this.retryLocationRequest();
        }
      }, 5000);
    }
    
    // You might want to emit an error event here
    // this.emit('locationError', { message, code: error.code });
  }

  private retryLocationRequest(): void {
    if (!this.isSharing) return;
    
    console.log('[LocationService] Retrying location request...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Resume normal watchPosition after successful retry
        if (this.isSharing) {
          console.log('[LocationService] Location retry successful, resuming tracking...');
        }
      },
      (error) => {
        console.error('[LocationService] Location retry failed:', error);
        this.handleLocationError(error);
      },
      {
        enableHighAccuracy: false, // Use less accurate but faster method for retry
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }

  private setupFallbackLocationTracking(driverId: string, busId: string): void {
    if (!this.isSharing) return;
    
    console.log('[LocationService] Setting up fallback location tracking with lower accuracy...');
    
    // Clear the high accuracy watch
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    
    // Start fallback tracking with lower accuracy
    this.fallbackWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.handleLocationUpdateFromGeolocation(position, driverId, busId);
      },
      (error) => {
        console.error('[LocationService] Fallback location error:', error);
        this.handleLocationError(error);
      },
      {
        enableHighAccuracy: false, // Lower accuracy but more reliable
        timeout: 20000, // Shorter timeout for fallback
        maximumAge: 30000 // Accept older location data
      }
    );
  }

  public async getLocationHistory(busId: string): Promise<LocationData[]> {
    try {
      // Try to get from Firebase first
      const firebaseLocations = await busService.getBusLocations(busId);
      if (firebaseLocations.length > 0) {
        return firebaseLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp,
          driverId: '', // Will be filled by caller
          busId: busId,
          accuracy: loc.accuracy
        }));
      }
      
      // Fallback to localStorage
      const key = `bus_location_${busId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[LocationService] Error getting location history:', error);
      
      // Fallback to localStorage
      try {
        const key = `bus_location_${busId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      } catch (localError) {
        console.error('[LocationService] Error getting from localStorage:', localError);
        return [];
      }
    }
  }

  public getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
            driverId: '',
            busId: '',
            accuracy: position.coords.accuracy
          });
        },
        () => {
          resolve(null);
        },
        { timeout: 10000 }
      );
    });
  }

  public isLocationSharing(): boolean {
    return this.isSharing;
  }

  public async getLocationHistoryForBus(busId: string): Promise<LocationData[]> {
    return await this.getLocationHistory(busId);
  }

  public handleWebSocketLocationUpdate(data: BusLocation): void {
    // This method will be called when receiving location updates from WebSocket
    console.log('[LocationService] Received WebSocket location update:', data);
    
    // Store the location update
    this.storeLocationInLocalStorage(data.location);
  }

  private async updateBusStatus(busId: string, status: 'active' | 'inactive'): Promise<void> {
    try {
      await busService.updateBus(busId, { status });
      console.log(`[LocationService] Bus ${busId} status updated to ${status}`);
    } catch (error) {
      console.error('[LocationService] Error updating bus status:', error);
    }
  }

  public disconnect(): void {
    this.stopLocationSharing();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
