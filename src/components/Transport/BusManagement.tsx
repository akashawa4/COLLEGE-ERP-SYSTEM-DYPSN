import React, { useState, useEffect } from 'react';
import {
  Bus,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Users,
  Clock,
  Search,
  AlertCircle,
  X,
  Loader2,
  Mail
} from 'lucide-react';
import { Bus as BusType, BusStop, User } from '../../types';
import { busService, userService } from '../../firebase/firestore';
import { locationService, BusLocation, LocationData } from '../../services/locationService';
import LiveBusMap from './LiveBusMap';

const BusManagement: React.FC<{ user: any }> = ({ user }) => {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showStopForm, setShowStopForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusType | null>(null);
  const [editingBus, setEditingBus] = useState<BusType | null>(null);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);

  // Live tracking states
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [busLocations, setBusLocations] = useState<Map<string, BusLocation>>(new Map());
  const [selectedBusForTracking, setSelectedBusForTracking] = useState<BusType | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  // Note: trackingLoading removed as it was not being used

  // Form states
  const [busForm, setBusForm] = useState({
    busNumber: '',
    busName: '',
    capacity: 50,
    type: 'Non-AC' as 'AC' | 'Non-AC' | 'Semi-AC',
    status: 'active' as 'active' | 'maintenance' | 'inactive',
    driverId: '',
    driverName: '',
    driverPhone: '',
    registrationNumber: '',
    model: '',
    year: new Date().getFullYear(),
    insuranceExpiry: '',
    lastServiceDate: '',
    nextServiceDate: '',
    fuelType: 'Diesel' as 'Diesel' | 'Petrol' | 'CNG' | 'Electric',
    features: [] as string[],
    notes: '',
    route: {
      routeName: '',
      routeNumber: '',
      startLocation: '',
      endLocation: '',
      stops: [] as BusStop[],
      distance: 0,
      estimatedTime: 0,
      operatingDays: [] as string[],
      startTime: '',
      endTime: '',
      description: ''
    }
  });


  const [stopForm, setStopForm] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    arrivalTime: '',
    sequence: 1,
    isMainStop: false,
    notes: ''
  });

  const isAdmin = user?.role === 'admin';

  // Live tracking functions
  const updateBusLocations = async () => {
    try {
      // Use the efficient Firebase method to get all bus locations at once
      const allBusLocations = await busService.getAllBusLocations();
      setBusLocations(allBusLocations);

      // Update location history for selected bus
      if (selectedBusForTracking) {
        try {
          const history = await locationService.getLocationHistoryForBus(selectedBusForTracking.id);
          setLocationHistory(history);
        } catch (error) {
          console.error('Error getting location history:', error);
        }
      }
    } catch (error) {
      console.error('Error updating bus locations:', error);

      // Fallback to individual bus queries
      const newBusLocations = new Map<string, BusLocation>();

      for (const bus of buses) {
        if (bus.driverId) {
          try {
            const history = await locationService.getLocationHistoryForBus(bus.id);

            if (history.length > 0) {
              const latestLocation = history[history.length - 1];
              const isOnline = Date.now() - latestLocation.timestamp < 30000; // 30 seconds threshold

              newBusLocations.set(bus.id, {
                busId: bus.id,
                busNumber: bus.busNumber,
                driverName: bus.driverName || 'Unknown Driver',
                location: latestLocation,
                isOnline,
                lastUpdate: latestLocation.timestamp
              });
            }
          } catch (error) {
            console.error(`Error getting location for bus ${bus.id}:`, error);
          }
        }
      }

      setBusLocations(newBusLocations);
    }
  };

  const handleLiveMapClick = () => {
    setShowLiveTracking(true);
    updateBusLocations();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      updateBusLocations();
    }, 5000);

    // Store interval ID for cleanup
    (window as any).trackingInterval = interval;
  };

  const handleBusSelectForTracking = async (bus: BusType) => {
    setSelectedBusForTracking(bus);
    try {
      const history = await locationService.getLocationHistoryForBus(bus.id);
      setLocationHistory(history);
    } catch (error) {
      console.error('Error getting location history:', error);
      setLocationHistory([]);
    }
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

  // Load drivers from database
  const loadDrivers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      const driverUsers = allUsers.filter(user => user.role === 'driver');
      setDrivers(driverUsers);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  // Handle driver selection
  const handleDriverSelect = (driverId: string) => {
    const selectedDriver = drivers.find(driver => driver.id === driverId);
    if (selectedDriver) {
      setBusForm({
        ...busForm,
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        driverPhone: selectedDriver.phone || ''
      });
    }
  };

  // Load data from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const busesData = await busService.getAllBuses();

        setBuses(busesData);

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    loadDrivers();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribeBuses = busService.listenBuses((buses) => {
      setBuses(buses);

      // Update bus locations when buses change
      if (showLiveTracking) {
        updateBusLocations();
      }
    });

    return () => {
      unsubscribeBuses();
    };
  }, [showLiveTracking]);

  // Cleanup tracking interval on unmount
  useEffect(() => {
    return () => {
      if ((window as any).trackingInterval) {
        clearInterval((window as any).trackingInterval);
      }
    };
  }, []);

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = searchTerm === '' ||
      bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.route?.routeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bus.status === filterStatus;
    return matchesSearch && matchesStatus;
  });



  const handleBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setLoading(true);

      if (editingBus) {
        await busService.updateBus(editingBus.id, busForm);
      } else {
        await busService.createBus(busForm);
      }

      setShowForm(false);
      setEditingBus(null);
      setBusForm({
        busNumber: '',
        busName: '',
        capacity: 50,
        type: 'Non-AC',
        status: 'active',
        driverId: '',
        driverName: '',
        driverPhone: '',
        registrationNumber: '',
        model: '',
        year: new Date().getFullYear(),
        insuranceExpiry: '',
        lastServiceDate: '',
        nextServiceDate: '',
        fuelType: 'Diesel',
        features: [],
        notes: '',
        route: {
          routeName: '',
          routeNumber: '',
          startLocation: '',
          endLocation: '',
          stops: [],
          distance: 0,
          estimatedTime: 0,
          operatingDays: [],
          startTime: '',
          endTime: '',
          description: ''
        }
      });
    } catch (error) {
      console.error('Error saving bus:', error);
      setError('Failed to save bus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Route submission is now handled as part of bus creation/update

  const handleDeleteBus = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this bus?')) return;

    try {
      setLoading(true);
      await busService.deleteBus(id);
    } catch (error) {
      console.error('Error deleting bus:', error);
      setError('Failed to delete bus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Route deletion is now handled as part of bus deletion

  const handleStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentRouteId) return;

    try {
      setLoading(true);

      const bus = buses.find(b => b.id === currentRouteId);
      if (!bus) return;

      const updatedStops = [...(bus.route.stops || [])];

      if (editingStop) {
        // Update existing stop
        const stopIndex = updatedStops.findIndex(s => s.id === editingStop.id);
        if (stopIndex !== -1) {
          updatedStops[stopIndex] = { ...stopForm, id: editingStop.id };
        }
      } else {
        // Add new stop
        const newStop: BusStop = {
          ...stopForm,
          id: `stop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedStops.push(newStop);
      }

      // Sort stops by sequence
      updatedStops.sort((a, b) => a.sequence - b.sequence);

      // Update bus with new stops in route
      await busService.updateBus(currentRouteId, {
        route: {
          ...bus.route,
          stops: updatedStops
        }
      });

      setShowStopForm(false);
      setEditingStop(null);
      setCurrentRouteId(null);
      setStopForm({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        arrivalTime: '',
        sequence: 1,
        isMainStop: false,
        notes: ''
      });
    } catch (error) {
      console.error('Error saving stop:', error);
      setError('Failed to save stop. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Prefixed with underscore to suppress lint warning - kept for future use
  const _handleDeleteStop = async (routeId: string, stopId: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this stop?')) return;

    try {
      setLoading(true);

      const bus = buses.find(b => b.id === routeId);
      if (!bus) return;

      const updatedStops = (bus.route.stops || []).filter(s => s.id !== stopId);

      await busService.updateBus(routeId, {
        route: {
          ...bus.route,
          stops: updatedStops
        }
      });
    } catch (error) {
      console.error('Error deleting stop:', error);
      setError('Failed to delete stop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBus = (bus: BusType) => {
    setEditingBus(bus);
    setBusForm({
      busNumber: bus.busNumber,
      busName: bus.busName,
      capacity: bus.capacity,
      type: bus.type,
      status: bus.status,
      driverName: bus.driverName || '',
      driverPhone: bus.driverPhone || '',
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      year: bus.year,
      insuranceExpiry: bus.insuranceExpiry,
      lastServiceDate: bus.lastServiceDate,
      nextServiceDate: bus.nextServiceDate,
      fuelType: bus.fuelType,
      features: bus.features || [],
      notes: bus.notes || '',
      route: bus.route || {
        routeName: '',
        routeNumber: '',
        startLocation: '',
        endLocation: '',
        stops: [],
        distance: 0,
        estimatedTime: 0,
        operatingDays: [],
        startTime: '',
        endTime: '',
        description: ''
      }
    });
    setShowForm(true);
  };


  // Prefixed with underscore to suppress lint warning - kept for future use
  const _handleEditStop = (stop: BusStop, routeId: string) => {
    setEditingStop(stop);
    setCurrentRouteId(routeId);
    setStopForm({
      name: stop.name,
      address: stop.address,
      latitude: stop.latitude || 0,
      longitude: stop.longitude || 0,
      arrivalTime: stop.arrivalTime,
      sequence: stop.sequence,
      isMainStop: stop.isMainStop,
      notes: stop.notes || ''
    });
    setShowStopForm(true);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AC': return '❄️';
      case 'Semi-AC': return '🌡️';
      default: return '🚌';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Bus Management</h1>
          <p className="text-sm text-slate-500">Manage college buses and routes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLiveMapClick}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Live Map</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingBus(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Bus</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            <p className="text-slate-700">Loading data...</p>
          </div>
        </div>
      )}


      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search buses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Buses Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bus Fleet</h3>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredBuses.map((bus) => (
            <div
              key={bus.id}
              className="p-4 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => {
                setSelectedBus(bus);
                setShowDetails(true);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{getTypeIcon(bus.type)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{bus.busNumber}</div>
                    <div className="text-xs text-gray-500">{bus.busName}</div>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bus.status)}`}>
                  {bus.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {bus.capacity} seats • {bus.type}
                </div>
                {bus.driverName && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {bus.driverName} - {bus.driverPhone}
                  </div>
                )}
                {bus.route?.routeName && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {bus.route.routeName}
                  </div>
                )}
                {bus.status === 'active' && (
                  <div className="flex items-center text-green-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    📍 Sharing Live Location
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBus(bus);
                        }}
                        className="text-green-600 hover:text-green-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBus(bus.id);
                        }}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                {bus.driverPhone && (
                  <a
                    href={`tel:${bus.driverPhone}`}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Call Driver"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuses.map((bus) => (
                <tr
                  key={bus.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedBus(bus);
                    setShowDetails(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{getTypeIcon(bus.type)}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bus.busNumber}</div>
                        <div className="text-sm text-gray-500">{bus.busName}</div>
                        <div className="text-xs text-gray-400">
                          {bus.capacity} seats • {bus.type} • {bus.model}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{bus.driverName || 'Not assigned'}</div>
                      {bus.driverPhone && (
                        <div className="text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {bus.driverPhone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {bus.driverPhone ? (
                        <a
                          href={`tel:${bus.driverPhone}`}
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          {bus.driverPhone}
                        </a>
                      ) : (
                        <div className="font-medium text-gray-500">No contact</div>
                      )}
                      <div className="text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {'No email'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bus.status)}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBus(bus);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBus(bus.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {bus.driverPhone && (
                        <a
                          href={`tel:${bus.driverPhone}`}
                          className="text-green-600 hover:text-green-900"
                          title="Call Driver"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBuses.length === 0 && (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>


      {/* Bus Form Modal */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingBus ? 'Edit Bus' : 'Add Bus'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBus(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleBusSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                    <input
                      type="text"
                      value={busForm.busNumber}
                      onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bus Name</label>
                    <input
                      type="text"
                      value={busForm.busName}
                      onChange={(e) => setBusForm({ ...busForm, busName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={busForm.capacity}
                      onChange={(e) => setBusForm({ ...busForm, capacity: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={busForm.type}
                      onChange={(e) => setBusForm({ ...busForm, type: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="Non-AC">Non-AC</option>
                      <option value="Semi-AC">Semi-AC</option>
                      <option value="AC">AC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                    <select
                      value={drivers.find(d => d.name === busForm.driverName)?.id || ''}
                      onChange={(e) => handleDriverSelect(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Select a driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} {driver.phone && `(${driver.phone})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone</label>
                    <input
                      type="tel"
                      value={busForm.driverPhone}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
                      placeholder="Phone number will be auto-filled when driver is selected"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={busForm.registrationNumber}
                      onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={busForm.model}
                      onChange={(e) => setBusForm({ ...busForm, model: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>


                {/* Bus Stops Section */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Bus Stops</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newStop: BusStop = {
                          id: Date.now().toString(),
                          name: '',
                          address: '',
                          latitude: 0,
                          longitude: 0,
                          arrivalTime: '',
                          sequence: busForm.route.stops.length + 1,
                          isMainStop: false,
                          notes: ''
                        };
                        setBusForm({
                          ...busForm,
                          route: {
                            ...busForm.route,
                            stops: [...busForm.route.stops, newStop]
                          }
                        });
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Stop</span>
                    </button>
                  </div>

                  {busForm.route.stops.map((stop, index) => (
                    <div key={stop.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <h4 className="font-medium text-gray-900">Stop {index + 1}</h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stop Name</label>
                            <input
                              type="text"
                              value={stop.name}
                              onChange={(e) => {
                                const updatedStops = busForm.route.stops.map(s =>
                                  s.id === stop.id ? { ...s, name: e.target.value } : s
                                );
                                setBusForm({
                                  ...busForm,
                                  route: { ...busForm.route, stops: updatedStops }
                                });
                              }}
                              className="w-48 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder={`Stop ${index + 1} Name`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                            <input
                              type="time"
                              value={stop.arrivalTime}
                              onChange={(e) => {
                                const updatedStops = busForm.route.stops.map(s =>
                                  s.id === stop.id ? { ...s, arrivalTime: e.target.value } : s
                                );
                                setBusForm({
                                  ...busForm,
                                  route: { ...busForm.route, stops: updatedStops }
                                });
                              }}
                              className="w-32 border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedStops = busForm.route.stops.filter(s => s.id !== stop.id);
                            // Reorder sequence numbers
                            const reorderedStops = updatedStops.map((s, idx) => ({
                              ...s,
                              sequence: idx + 1
                            }));
                            setBusForm({
                              ...busForm,
                              route: {
                                ...busForm.route,
                                stops: reorderedStops
                              }
                            });
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}


                  {busForm.route.stops.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No stops added yet. Click "Add Stop" to add bus stops.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingBus(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingBus ? 'Update Bus' : 'Save Bus'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Details Modal */}
      {showDetails && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="theme-page-title">
                  Bus Details
                </h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedBus(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedBus && (
                <div className="space-y-6">
                  {/* Bus Information Card */}
                  <div className="theme-card p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                        <Bus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="theme-section-title">Bus Information</h3>
                        <p className="text-sm text-gray-600">Vehicle details and specifications</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Number:</span>
                          <span className="text-gray-900 font-semibold">{selectedBus.busNumber}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-900 font-semibold">{selectedBus.busName}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Capacity:</span>
                          <span className="text-gray-900 font-semibold">{selectedBus.capacity} seats</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="font-medium text-gray-700">Type:</span>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${selectedBus.type === 'AC' ? 'theme-badge-success' :
                            selectedBus.type === 'Semi-AC' ? 'theme-badge-warning' :
                              'theme-badge-neutral'
                            }`}>
                            {selectedBus.type}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Model:</span>
                          <span className="text-gray-900 font-semibold">{selectedBus.model}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Year:</span>
                          <span className="text-gray-900 font-semibold">{selectedBus.year}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Registration:</span>
                          <span className="text-gray-900 font-semibold">{selectedBus.registrationNumber}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBus.status)}`}>
                            {selectedBus.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information Card */}
                  <div className="theme-card p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="theme-section-title">Driver Information</h3>
                        <p className="text-sm text-gray-600">Assigned driver details</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Driver:</span>
                          <span className="text-gray-900 font-semibold">
                            {selectedBus.driverName || 'Not assigned'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                          <span className="font-medium text-gray-700">Phone:</span>
                          {selectedBus.driverPhone ? (
                            <a
                              href={`tel:${selectedBus.driverPhone}`}
                              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              {selectedBus.driverPhone}
                            </a>
                          ) : (
                            <span className="text-gray-500">Not assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bus Stops Section */}
                  <div className="theme-card p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="theme-section-title">Bus Stops</h3>
                        <p className="text-sm text-gray-600">Route stops and arrival times</p>
                      </div>
                    </div>

                    {selectedBus.route?.stops && selectedBus.route.stops.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBus.route.stops.map((stop, index) => (
                          <div key={stop.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center text-sm font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{stop.name || `Stop ${index + 1}`}</div>
                                  {stop.address && (
                                    <div className="text-sm text-gray-600 mt-1">{stop.address}</div>
                                  )}
                                  {stop.arrivalTime && (
                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                      <Clock className="w-4 h-4 mr-1" />
                                      Arrival: {stop.arrivalTime}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {stop.isMainStop && (
                                <span className="theme-badge-info">
                                  Main Stop
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No stops added</h4>
                        <p className="text-gray-600">This bus doesn't have any stops assigned yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Stop Form Modal */}
      {showStopForm && isAdmin && currentRouteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingStop ? 'Edit Stop' : 'Add Stop'}
                </h2>
                <button
                  onClick={() => {
                    setShowStopForm(false);
                    setEditingStop(null);
                    setCurrentRouteId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleStopSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stop Name</label>
                    <input
                      type="text"
                      value={stopForm.name}
                      onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sequence</label>
                    <input
                      type="number"
                      value={stopForm.sequence}
                      onChange={(e) => setStopForm({ ...stopForm, sequence: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={stopForm.address}
                      onChange={(e) => setStopForm({ ...stopForm, address: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                    <input
                      type="time"
                      value={stopForm.arrivalTime}
                      onChange={(e) => setStopForm({ ...stopForm, arrivalTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={stopForm.latitude}
                      onChange={(e) => setStopForm({ ...stopForm, latitude: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={stopForm.longitude}
                      onChange={(e) => setStopForm({ ...stopForm, longitude: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={stopForm.notes}
                      onChange={(e) => setStopForm({ ...stopForm, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={stopForm.isMainStop}
                        onChange={(e) => setStopForm({ ...stopForm, isMainStop: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Main Stop</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStopForm(false);
                      setEditingStop(null);
                      setCurrentRouteId(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingStop ? 'Update Stop' : 'Save Stop'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Modal */}
      {showLiveTracking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Live Bus Tracking</h2>
                <button
                  onClick={() => {
                    setShowLiveTracking(false);
                    setSelectedBusForTracking(null);
                    if ((window as any).trackingInterval) {
                      clearInterval((window as any).trackingInterval);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bus List */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Buses</h3>
                    <div className="space-y-3">
                      {buses.map(bus => {
                        const busLocation = busLocations.get(bus.id);
                        const isOnline = busLocation?.isOnline || false;

                        return (
                          <div
                            key={bus.id}
                            onClick={() => handleBusSelectForTracking(bus)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedBusForTracking?.id === bus.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{bus.busNumber}</h4>
                                <p className="text-sm text-gray-600">{bus.driverName || 'No Driver'}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded-full ${bus.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : bus.status === 'maintenance'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                    }`}>
                                    {bus.status}
                                  </span>
                                  {bus.status === 'active' && (
                                    <span className="text-xs text-green-600 font-medium">
                                      📍 Sharing Location
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></div>
                                <span className="text-xs text-gray-500">
                                  {isOnline ? 'Live' : 'Offline'}
                                </span>
                              </div>
                            </div>
                            {busLocation && (
                              <div className="mt-2 text-xs text-gray-500">
                                Last update: {formatTimeAgo(busLocation.lastUpdate)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Map and Details */}
                <div className="lg:col-span-2">
                  {selectedBusForTracking ? (
                    <div className="space-y-6">
                      {/* Interactive Map */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Live Bus Locations
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Real-time tracking of all buses
                          </p>
                        </div>
                        <div className="h-96">
                          <LiveBusMap
                            busLocations={busLocations}
                            selectedBus={selectedBusForTracking}
                            onBusSelect={handleBusSelectForTracking}
                            buses={buses}
                          />
                        </div>
                      </div>

                      {/* Bus Details */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><span className="font-medium text-gray-700">Bus Number:</span> {selectedBusForTracking.busNumber}</p>
                            <p><span className="font-medium text-gray-700">Driver:</span> {selectedBusForTracking.driverName || 'Not Assigned'}</p>
                            <p><span className="font-medium text-gray-700">Phone:</span> {selectedBusForTracking.driverPhone || 'N/A'}</p>
                            <p><span className="font-medium text-gray-700">Route:</span> {selectedBusForTracking.route?.routeName || 'Not Set'}</p>
                          </div>
                          <div>
                            <p><span className="font-medium text-gray-700">Type:</span> {selectedBusForTracking.type || 'N/A'}</p>
                            <p><span className="font-medium text-gray-700">Capacity:</span> {selectedBusForTracking.capacity || 'N/A'} seats</p>
                            <p><span className="font-medium text-gray-700">Status:</span>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${busLocations.get(selectedBusForTracking.id)?.isOnline
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {busLocations.get(selectedBusForTracking.id)?.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Location History */}
                      {locationHistory.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Locations</h3>
                          <div className="space-y-3">
                            {locationHistory.slice(-5).reverse().map((location, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Accuracy: {getLocationAccuracy(location.accuracy)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">{formatTimeAgo(location.timestamp)}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(location.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Interactive Map - Show all buses */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Live Bus Locations
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Click on a bus marker or select from the list to view details
                          </p>
                        </div>
                        <div className="h-96">
                          <LiveBusMap
                            busLocations={busLocations}
                            selectedBus={null}
                            onBusSelect={handleBusSelectForTracking}
                            buses={buses}
                          />
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start">
                          <MapPin className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">How to use the map</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Click on bus markers to see details</li>
                              <li>• Select a bus from the list to center the map</li>
                              <li>• Green markers indicate online buses</li>
                              <li>• Gray markers indicate offline buses</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusManagement;