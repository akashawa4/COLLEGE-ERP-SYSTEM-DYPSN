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
  Route,
  Calendar
} from 'lucide-react';
import { Bus as BusType, BusRoute, BusStop } from '../../types';
import { busService, busRouteService } from '../../firebase/firestore';

const BusManagement: React.FC<{ user: any }> = ({ user }) => {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showStopForm, setShowStopForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusType | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [activeTab, setActiveTab] = useState<'buses' | 'routes'>('buses');
  const [editingBus, setEditingBus] = useState<BusType | null>(null);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);

  // Form states
  const [busForm, setBusForm] = useState({
    busNumber: '',
    busName: '',
    capacity: 50,
    type: 'Non-AC' as 'AC' | 'Non-AC' | 'Semi-AC',
    status: 'active' as 'active' | 'maintenance' | 'inactive',
    driverName: '',
    driverPhone: '',
    routeName: '',
    registrationNumber: '',
    model: '',
    year: new Date().getFullYear(),
    insuranceExpiry: '',
    lastServiceDate: '',
    nextServiceDate: '',
    fuelType: 'Diesel' as 'Diesel' | 'Petrol' | 'CNG' | 'Electric',
    features: [] as string[],
    notes: ''
  });

  const [routeForm, setRouteForm] = useState({
    routeName: '',
    routeNumber: '',
    startLocation: '',
    endLocation: '',
    distance: 0,
    estimatedTime: 0,
    status: 'active' as 'active' | 'inactive' | 'suspended',
    operatingDays: [] as string[],
    startTime: '',
    endTime: '',
    description: ''
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

  // Load data from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [busesData, routesData] = await Promise.all([
          busService.getAllBuses(),
          busRouteService.getAllBusRoutes()
        ]);
        
        setBuses(busesData);
        setRoutes(routesData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribeBuses = busService.listenBuses((buses) => {
      setBuses(buses);
    });

    const unsubscribeRoutes = busRouteService.listenBusRoutes((routes) => {
      setRoutes(routes);
    });

    return () => {
      unsubscribeBuses();
      unsubscribeRoutes();
    };
  }, []);

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = searchTerm === '' || 
      bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.routeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bus.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = searchTerm === '' || 
      route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.startLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.endLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStopsForRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    return route?.stops || [];
  };

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
        driverName: '',
        driverPhone: '',
        routeName: '',
        registrationNumber: '',
        model: '',
        year: new Date().getFullYear(),
        insuranceExpiry: '',
        lastServiceDate: '',
        nextServiceDate: '',
        fuelType: 'Diesel',
        features: [],
        notes: ''
      });
    } catch (error) {
      console.error('Error saving bus:', error);
      setError('Failed to save bus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      const routeData = {
        ...routeForm,
        stops: editingRoute ? editingRoute.stops || [] : []
      };
      
      if (editingRoute) {
        await busRouteService.updateBusRoute(editingRoute.id, routeData);
      } else {
        await busRouteService.createBusRoute(routeData);
      }
      
      setShowRouteForm(false);
      setEditingRoute(null);
      setRouteForm({
        routeName: '',
        routeNumber: '',
        startLocation: '',
        endLocation: '',
        distance: 0,
        estimatedTime: 0,
        status: 'active',
        operatingDays: [],
        startTime: '',
        endTime: '',
        description: ''
      });
    } catch (error) {
      console.error('Error saving route:', error);
      setError('Failed to save route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteRoute = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this route?')) return;
    
    try {
      setLoading(true);
      await busRouteService.deleteBusRoute(id);
    } catch (error) {
      console.error('Error deleting route:', error);
      setError('Failed to delete route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentRouteId) return;
    
    try {
      setLoading(true);
      
      const route = routes.find(r => r.id === currentRouteId);
      if (!route) return;
      
      const updatedStops = [...(route.stops || [])];
      
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
      
      // Update route with new stops
      await busRouteService.updateBusRoute(currentRouteId, {
        stops: updatedStops
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

  const handleDeleteStop = async (routeId: string, stopId: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this stop?')) return;
    
    try {
      setLoading(true);
      
      const route = routes.find(r => r.id === routeId);
      if (!route) return;
      
      const updatedStops = (route.stops || []).filter(s => s.id !== stopId);
      
      await busRouteService.updateBusRoute(routeId, {
        stops: updatedStops
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
      routeName: bus.routeName || '',
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      year: bus.year,
      insuranceExpiry: bus.insuranceExpiry,
      lastServiceDate: bus.lastServiceDate,
      nextServiceDate: bus.nextServiceDate,
      fuelType: bus.fuelType,
      features: bus.features || [],
      notes: bus.notes || ''
    });
    setShowForm(true);
  };

  const handleEditRoute = (route: BusRoute) => {
    setEditingRoute(route);
    setRouteForm({
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      distance: route.distance,
      estimatedTime: route.estimatedTime,
      status: route.status,
      operatingDays: route.operatingDays || [],
      startTime: route.startTime,
      endTime: route.endTime,
      description: route.description || ''
    });
    setShowRouteForm(true);
  };

  const handleEditStop = (stop: BusStop, routeId: string) => {
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

  const handleAddStop = (routeId: string) => {
    setCurrentRouteId(routeId);
    setEditingStop(null);
    setStopForm({
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      arrivalTime: '',
      sequence: getStopsForRoute(routeId).length + 1,
      isMainStop: false,
      notes: ''
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bus Management</h1>
          <p className="text-gray-600 mt-1">Manage college buses and routes</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => {
                setEditingRoute(null);
                setShowRouteForm(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Route</span>
              <span className="sm:hidden">Route</span>
            </button>
            <button
              onClick={() => {
                setEditingBus(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Bus</span>
              <span className="sm:hidden">Bus</span>
            </button>
          </div>
        )}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800">Loading data...</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('buses')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'buses'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bus className="w-4 h-4 inline mr-2" />
          Buses ({buses.length})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'routes'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Route className="w-4 h-4 inline mr-2" />
          Routes ({routes.length})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {activeTab === 'buses' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
        </div>
      </div>

      {/* Buses Tab */}
      {activeTab === 'buses' && (
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
                  {bus.routeName && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {bus.routeName}
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
                    Route
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
                        <div className="font-medium">{bus.routeName || 'Not assigned'}</div>
                        <div className="text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {bus.registrationNumber}
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
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Bus Routes</h3>
          </div>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {filteredRoutes.map((route) => {
              const routeStops = getStopsForRoute(route.id);
              return (
                <div 
                  key={route.id} 
                  className="p-4 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setSelectedRoute(route);
                    setShowDetails(true);
                  }}
                >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{route.routeName}</div>
                    <div className="text-xs text-gray-500">{route.routeNumber}</div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
                    {route.status}
                  </span>
                </div>
                
                 <div className="space-y-2 text-sm text-gray-600 mb-3">
                   <div className="flex items-center">
                     <MapPin className="w-4 h-4 mr-2" />
                     {route.startLocation} → {route.endLocation}
                   </div>
                   <div className="flex items-center">
                     <Clock className="w-4 h-4 mr-2" />
                     {route.distance} km • {route.estimatedTime} min
                   </div>
                   <div className="flex items-center">
                     <Calendar className="w-4 h-4 mr-2" />
                     {route.startTime} - {route.endTime}
                   </div>
                   {routeStops.length > 0 && (
                     <div className="flex items-start">
                       <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                       <div className="text-xs">
                         <div className="font-medium text-gray-700 mb-1">Stops ({routeStops.length}):</div>
                         <div className="text-gray-500">
                           {routeStops.slice(0, 3).map(stop => stop.name).join(' → ')}
                           {routeStops.length > 3 && ' → ...'}
                         </div>
                       </div>
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
                             handleEditRoute(route);
                           }}
                           className="text-green-600 hover:text-green-900 p-1"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDeleteRoute(route.id);
                           }}
                           className="text-red-600 hover:text-red-900 p-1"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </>
                     )}
                   </div>
                 </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
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
                 {filteredRoutes.map((route) => {
                   const routeStops = getStopsForRoute(route.id);
                   return (
                     <tr 
                       key={route.id} 
                       className="hover:bg-gray-50 cursor-pointer"
                       onClick={() => {
                         setSelectedRoute(route);
                         setShowDetails(true);
                       }}
                     >
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         <div className="font-medium">{route.routeName}</div>
                         <div className="text-gray-500">{route.routeNumber}</div>
                         <div className="text-xs text-gray-400">
                           {route.startLocation} → {route.endLocation}
                         </div>
                         {routeStops.length > 0 && (
                           <div className="text-xs text-blue-600 mt-1">
                             {routeStops.length} stops
                           </div>
                         )}
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {route.distance} km
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {route.estimatedTime} min
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="text-gray-500">
                          {route.startTime} - {route.endTime}
                        </div>
                        <div className="text-xs text-gray-400">
                          {route.operatingDays.join(', ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
                        {route.status}
                      </span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <div className="flex items-center space-x-2">
                         {isAdmin && (
                           <>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleEditRoute(route);
                               }}
                               className="text-green-600 hover:text-green-900"
                             >
                               <Edit className="w-4 h-4" />
                             </button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteRoute(route.id);
                               }}
                               className="text-red-600 hover:text-red-900"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </>
                         )}
                       </div>
                     </td>
                   </tr>
                   );
                 })}
              </tbody>
            </table>
          </div>

          {filteredRoutes.length === 0 && (
            <div className="text-center py-12">
              <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
              <p className="text-gray-600">Try adding a new route</p>
            </div>
          )}
        </div>
      )}

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
                      onChange={(e) => setBusForm({...busForm, busNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bus Name</label>
                    <input
                      type="text"
                      value={busForm.busName}
                      onChange={(e) => setBusForm({...busForm, busName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={busForm.capacity}
                      onChange={(e) => setBusForm({...busForm, capacity: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={busForm.type}
                      onChange={(e) => setBusForm({...busForm, type: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="Non-AC">Non-AC</option>
                      <option value="Semi-AC">Semi-AC</option>
                      <option value="AC">AC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={busForm.driverName}
                      onChange={(e) => setBusForm({...busForm, driverName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone</label>
                    <input
                      type="tel"
                      value={busForm.driverPhone}
                      onChange={(e) => setBusForm({...busForm, driverPhone: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={busForm.registrationNumber}
                      onChange={(e) => setBusForm({...busForm, registrationNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={busForm.model}
                      onChange={(e) => setBusForm({...busForm, model: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
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

      {/* Route Form Modal */}
      {showRouteForm && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRoute ? 'Edit Route' : 'Add Route'}
                </h2>
                <button
                  onClick={() => {
                    setShowRouteForm(false);
                    setEditingRoute(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleRouteSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                    <input
                      type="text"
                      value={routeForm.routeName}
                      onChange={(e) => setRouteForm({...routeForm, routeName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route Number</label>
                    <input
                      type="text"
                      value={routeForm.routeNumber}
                      onChange={(e) => setRouteForm({...routeForm, routeNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Location</label>
                    <input
                      type="text"
                      value={routeForm.startLocation}
                      onChange={(e) => setRouteForm({...routeForm, startLocation: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Location</label>
                    <input
                      type="text"
                      value={routeForm.endLocation}
                      onChange={(e) => setRouteForm({...routeForm, endLocation: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                    <input
                      type="number"
                      value={routeForm.distance}
                      onChange={(e) => setRouteForm({...routeForm, distance: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (min)</label>
                    <input
                      type="number"
                      value={routeForm.estimatedTime}
                      onChange={(e) => setRouteForm({...routeForm, estimatedTime: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={routeForm.status}
                      onChange={(e) => setRouteForm({...routeForm, status: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRouteForm(false);
                      setEditingRoute(null);
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
                    {loading ? 'Saving...' : editingRoute ? 'Update Route' : 'Save Route'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (selectedBus || selectedRoute) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedBus ? 'Bus Details' : 'Route Details'}
                </h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedBus(null);
                    setSelectedRoute(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {selectedBus && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Bus Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Number:</span> {selectedBus.busNumber}</p>
                        <p><span className="font-medium">Name:</span> {selectedBus.busName}</p>
                        <p><span className="font-medium">Capacity:</span> {selectedBus.capacity} seats</p>
                        <p><span className="font-medium">Type:</span> {selectedBus.type}</p>
                        <p><span className="font-medium">Model:</span> {selectedBus.model}</p>
                        <p><span className="font-medium">Year:</span> {selectedBus.year}</p>
                        <p><span className="font-medium">Registration:</span> {selectedBus.registrationNumber}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Driver Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Driver:</span> {selectedBus.driverName || 'Not assigned'}</p>
                        <p><span className="font-medium">Driver Phone:</span> 
                          {selectedBus.driverPhone ? (
                            <a href={`tel:${selectedBus.driverPhone}`} className="text-blue-600 ml-1">
                              {selectedBus.driverPhone}
                            </a>
                          ) : 'Not assigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

               {selectedRoute && (
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <h3 className="font-semibold text-gray-900 mb-3">Route Information</h3>
                       <div className="space-y-2">
                         <p><span className="font-medium">Name:</span> {selectedRoute.routeName}</p>
                         <p><span className="font-medium">Number:</span> {selectedRoute.routeNumber}</p>
                         <p><span className="font-medium">From:</span> {selectedRoute.startLocation}</p>
                         <p><span className="font-medium">To:</span> {selectedRoute.endLocation}</p>
                         <p><span className="font-medium">Distance:</span> {selectedRoute.distance} km</p>
                         <p><span className="font-medium">Time:</span> {selectedRoute.estimatedTime} minutes</p>
                       </div>
                     </div>
                     <div>
                       <h3 className="font-semibold text-gray-900 mb-3">Schedule</h3>
                       <div className="space-y-2">
                         <p><span className="font-medium">Start Time:</span> {selectedRoute.startTime}</p>
                         <p><span className="font-medium">End Time:</span> {selectedRoute.endTime}</p>
                         <p><span className="font-medium">Operating Days:</span> {selectedRoute.operatingDays.join(', ')}</p>
                         <p><span className="font-medium">Status:</span> 
                           <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRoute.status)}`}>
                             {selectedRoute.status}
                           </span>
                         </p>
                       </div>
                     </div>
                   </div>
                   
                   {/* Route Stops */}
                   <div>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold text-gray-900">Route Stops</h3>
                       {isAdmin && (
                         <button
                           onClick={() => handleAddStop(selectedRoute.id)}
                           className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                         >
                           Add Stop
                         </button>
                       )}
                     </div>
                     <div className="space-y-2">
                       {getStopsForRoute(selectedRoute.id).map((stop) => (
                         <div key={stop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <div className="flex items-center">
                             <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                               {stop.sequence}
                             </div>
                             <div>
                               <div className="font-medium text-gray-900">{stop.name}</div>
                               <div className="text-sm text-gray-500">{stop.address}</div>
                             </div>
                           </div>
                           <div className="flex items-center space-x-2">
                             <div className="text-sm text-gray-600">
                               <Clock className="w-4 h-4 inline mr-1" />
                               {stop.arrivalTime}
                             </div>
                             {stop.isMainStop && (
                               <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                 Main
                               </span>
                             )}
                             {isAdmin && (
                               <div className="flex space-x-1">
                                 <button
                                   onClick={() => handleEditStop(stop, selectedRoute.id)}
                                   className="text-green-600 hover:text-green-900 p-1"
                                 >
                                   <Edit className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => handleDeleteStop(selectedRoute.id, stop.id)}
                                   className="text-red-600 hover:text-red-900 p-1"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             )}
                           </div>
                         </div>
                       ))}
                       {getStopsForRoute(selectedRoute.id).length === 0 && (
                         <div className="text-center py-8 text-gray-500">
                           <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                           <p>No stops added to this route yet</p>
                         </div>
                       )}
                     </div>
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
                      onChange={(e) => setStopForm({...stopForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sequence</label>
                    <input
                      type="number"
                      value={stopForm.sequence}
                      onChange={(e) => setStopForm({...stopForm, sequence: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={stopForm.address}
                      onChange={(e) => setStopForm({...stopForm, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                    <input
                      type="time"
                      value={stopForm.arrivalTime}
                      onChange={(e) => setStopForm({...stopForm, arrivalTime: e.target.value})}
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
                      onChange={(e) => setStopForm({...stopForm, latitude: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={stopForm.longitude}
                      onChange={(e) => setStopForm({...stopForm, longitude: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={stopForm.notes}
                      onChange={(e) => setStopForm({...stopForm, notes: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={stopForm.isMainStop}
                        onChange={(e) => setStopForm({...stopForm, isMainStop: e.target.checked})}
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
    </div>
  );
};

export default BusManagement;